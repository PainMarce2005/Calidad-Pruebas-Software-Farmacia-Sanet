const { expect } = require('chai');
const { createDriver } = require('../pages/driver');
const LoginPage = require('../pages/LoginPage');
const SalesPage = require('../pages/SalesPage');
const { getCredentials } = require('../pages/credentials');

const adminCredentials = getCredentials('admin');

describe('Punto de venta y control de stock', function () {
  this.timeout(90000);

  let driver;
  let loginPage;
  let salesPage;

  before(async function () {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    salesPage = new SalesPage(driver);
  });

  beforeEach(async function () {
    await loginPage.open();
    await loginPage.login(adminCredentials.email, adminCredentials.password);
    await loginPage.waitForRole('Admin');
    await salesPage.open();
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('CP5: Actualización de stock post-venta', async function () {
    const clients = await salesPage.getActiveClientsFromApi();
    expect(clients, 'Se requiere al menos un cliente activo').to.not.be.empty;
    const products = await salesPage.getAvailableProductsFromApi();
    const product = products.find((item) => Number(item.stock) > 0);
    expect(product, 'Se requiere un producto con stock disponible').to.exist;

    await salesPage.addProductToCart(product);
    await salesPage.selectClientByName(clients[0].nombre);
    const initialStock = Number(product.stock);
    let saleId;

    try {
      await salesPage.openConfirmation();
      await salesPage.confirmSale();
      saleId = (await salesPage.waitForSaleSuccess()).id;

      const updated = await salesPage.getProductFromApi(product.id);
      expect(Number(updated.stock)).to.equal(initialStock - 1);
    } finally {
      if (saleId) {
        const cancellation = await salesPage.api(
          `/api/ventas/${encodeURIComponent(saleId)}/anular`,
          { method: 'PUT', body: {} }
        );
        expect(cancellation.status).to.equal(200);
        const restored = await salesPage.getProductFromApi(product.id);
        expect(Number(restored.stock)).to.equal(initialStock);
      }
    }
  });

  it('CP6: Validación de stock insuficiente', async function () {
    const products = await salesPage.getAvailableProductsFromApi();
    const product = products.find((item) => Number(item.stock) > 0);
    expect(product, 'Se requiere un producto para comprobar el límite de stock').to.exist;
    const stock = Number(product.stock);
    const price = Number(product.precio);
    const quantity = stock + 1;
    const subtotal = price * quantity;

    const response = await salesPage.api('/api/ventas', {
      method: 'POST',
      body: {
        cliente_nombre: 'Validación CP6',
        tipo_doc: 'Boleta',
        metodo_pago: 'Efectivo',
        subtotal,
        igv: subtotal * 0.18,
        total: subtotal * 1.18,
        items: [{
          producto_id: product.id,
          producto_nombre: product.nombre,
          cantidad: quantity,
          precio_unit: price,
          subtotal,
        }],
      },
    });

    expect(response.status).to.equal(400);
    expect(response.body.error).to.include('Stock insuficiente');
    const unchanged = await salesPage.getProductFromApi(product.id);
    expect(Number(unchanged.stock)).to.equal(stock);
  });
});
