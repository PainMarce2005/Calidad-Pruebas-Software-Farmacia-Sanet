const { expect } = require('chai');
const { createDriver } = require('../pages/driver');
const LoginPage = require('../pages/LoginPage');
const ProductPage = require('../pages/ProductPage');
const { getCredentials } = require('../pages/credentials');

const adminCredentials = getCredentials('admin');

describe('Inventario y catálogo de productos', function () {
  this.timeout(60000);

  let driver;
  let loginPage;
  let productPage;

  before(async function () {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    productPage = new ProductPage(driver);
  });

  beforeEach(async function () {
    await loginPage.open();
    await loginPage.login(adminCredentials.email, adminCredentials.password);
    await loginPage.waitForRole('Admin');
    await productPage.open();
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('CP7: Generación de alertas de stock mínimo', async function () {
    const id = `E${Date.now().toString(36)}`;
    const nombre = `Alerta CP7 ${id}`;

    try {
      const created = await productPage.api('/api/productos', {
        method: 'POST',
        body: {
          id,
          nombre,
          descripcion: 'Producto temporal para validar alerta de stock mínimo',
          laboratorio: 'Laboratorio E2E',
          lote: id,
          stock: 1,
          stock_minimo: 5,
          precio: 1,
          vencimiento: '2028-12-31',
          estado: 'activo',
          categoria: '',
        },
      });
      expect(created.status, JSON.stringify(created.body)).to.equal(201);

      const alerts = await productPage.api('/api/productos/alertas');
      expect(alerts.status).to.equal(200);
      const alert = alerts.body.find((entry) => String(entry.productoId) === id);
      expect(alert, `Debe existir una alerta de stock para ${id}`).to.exist;
      expect(alert).to.include({ nombre, minimo: 5 });
      expect(Number(alert.stock)).to.equal(1);
    } finally {
      const cleanup = await productPage.api(`/api/productos/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      expect(cleanup.status).to.equal(200);
    }
  });

  it('CP8: Control de fechas de vencimiento', async function () {
    const products = await productPage.getProductsFromApi();
    const cutoff = Date.now() + 12 * 24 * 60 * 60 * 1000;
    const expiring = products.find((product) =>
      !String(product.id).startsWith('E') &&
      new Date(product.vencimiento).getTime() <= cutoff
    );
    expect(expiring, 'El catálogo de prueba debe incluir un producto vencido o próximo a vencer')
      .to.exist;

    const details = await productPage.openProductDetails(expiring.id);
    expect(await details.getText()).to.include('Producto próximo a vencer o vencido');
  });

});
