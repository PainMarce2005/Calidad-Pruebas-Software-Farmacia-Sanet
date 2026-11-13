const { expect } = require('chai');
const { By } = require('selenium-webdriver');
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

  async function prepareSale(quantity = 1) {
    const clients = await salesPage.getActiveClientsFromApi();
    expect(clients, 'Se requiere al menos un cliente activo').to.not.be.empty;
    const products = await salesPage.getAvailableProductsFromApi();
    const product = products.find((item) => Number(item.stock) >= quantity);
    expect(product, 'Se requiere un producto con stock suficiente').to.exist;

    await salesPage.addProductToCart(product);
    if (quantity > 1) await salesPage.setQuantity(product.nombre, quantity);
    await salesPage.selectClientByName(clients[0].nombre);
    return { client: clients[0], product, quantity };
  }

  async function cancelAndRestoreSale(saleId, productId, initialStock) {
    if (!saleId) return;
    const response = await salesPage.api(`/api/ventas/${encodeURIComponent(saleId)}/anular`, {
      method: 'PUT',
      body: {},
    });
    expect(response.status).to.equal(200);
    const restored = await salesPage.getProductFromApi(productId);
    expect(Number(restored.stock)).to.equal(initialStock);
  }

  it('CP1: Registro de venta de productos', async function () {
    const { client, product } = await prepareSale();
    let saleId;
    const initialStock = Number(product.stock);

    try {
      await salesPage.openConfirmation();
      await salesPage.confirmSale();
      const success = await salesPage.waitForSaleSuccess();
      saleId = success.id;

      const persisted = await salesPage.getSaleFromApi(saleId);
      expect(Number(persisted.cliente_id)).to.equal(Number(client.id));
      expect(persisted.items).to.have.lengthOf(1);
      expect(String(persisted.items[0].producto_id)).to.equal(String(product.id));
      expect(Number(persisted.items[0].cantidad)).to.equal(1);
    } finally {
      await cancelAndRestoreSale(saleId, product.id, initialStock);
    }
  });

  it('CP2: Cálculo automático de totales e impuestos', async function () {
    const { product } = await prepareSale(2);
    const subtotal = Number((Number(product.precio) * 2).toFixed(2));
    const igv = Number((subtotal * 0.18).toFixed(2));
    const total = Number((subtotal + subtotal * 0.18).toFixed(2));

    expect(await salesPage.getTotals()).to.deep.equal({ subtotal, igv, total });
  });

  it('CP3: Selección de tipo de comprobante de pago', async function () {
    await prepareSale();
    await driver.findElement(By.xpath("//main//button[normalize-space(.)='Factura']")).click();
    await salesPage.openConfirmation();

    const confirmation = await driver.findElement(
      By.xpath("//h2[normalize-space(.)='Confirmar Venta']/ancestor::div[contains(@class,'rounded-xl')][1]")
    );
    expect(await confirmation.getText()).to.include('Comprobante');
    expect(await confirmation.getText()).to.include('Factura');
  });

});
