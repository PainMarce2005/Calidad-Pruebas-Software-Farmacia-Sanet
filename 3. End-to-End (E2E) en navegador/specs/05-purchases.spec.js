const { expect } = require('chai');
const { createDriver } = require('../pages/driver');
const LoginPage = require('../pages/LoginPage');
const PurchasePage = require('../pages/PurchasePage');
const { getCredentials } = require('../pages/credentials');

const adminCredentials = getCredentials('admin');

describe('Órdenes de compra', function () {
  this.timeout(60000);

  let driver;
  let loginPage;
  let purchasePage;

  before(async function () {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    purchasePage = new PurchasePage(driver);
  });

  beforeEach(async function () {
    await loginPage.open();
    await loginPage.login(adminCredentials.email, adminCredentials.password);
    await loginPage.waitForRole('Admin');
    await purchasePage.open();
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('CP9: Registro de órdenes de compra', async function () {
    const proveedor = `Proveedor CP9 ${Date.now()}`;
    const fecha = new Date().toISOString().slice(0, 10);
    let createdId;

    try {
      await purchasePage.createPurchase({
        proveedor,
        fecha,
        total: 125.5,
        estado: 'Pendiente',
        productos: '[]',
        notas: 'Orden de compra automatizada CP9',
      });
      expect(await purchasePage.waitForSuccess('Compra registrada exitosamente'))
        .to.equal('Compra registrada exitosamente');

      const purchases = await purchasePage.getPurchasesFromApi();
      const persisted = purchases.find((purchase) => purchase.proveedor === proveedor);
      expect(persisted, 'La orden de compra debe guardarse en la API').to.exist;
      createdId = persisted.id;
      expect(Number(persisted.total)).to.equal(125.5);
      expect(persisted.estado).to.equal('Pendiente');
    } finally {
      const purchases = await purchasePage.getPurchasesFromApi();
      const persisted = purchases.find((purchase) => purchase.proveedor === proveedor);
      const id = createdId || persisted?.id;
      if (id) {
        const cleanup = await purchasePage.api(`/api/compras/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        expect(cleanup.status).to.equal(200);
      }
    }
  });
});
