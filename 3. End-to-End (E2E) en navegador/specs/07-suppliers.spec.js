const { expect } = require('chai');
const { createDriver } = require('../pages/driver');
const LoginPage = require('../pages/LoginPage');
const SupplierPage = require('../pages/SupplierPage');
const { getCredentials } = require('../pages/credentials');

const adminCredentials = getCredentials('admin');

describe('Módulo de laboratorios', function () {
  this.timeout(60000);

  let driver;
  let loginPage;
  let supplierPage;

  before(async function () {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    supplierPage = new SupplierPage(driver);
  });

  beforeEach(async function () {
    await loginPage.open();
    await loginPage.login(adminCredentials.email, adminCredentials.password);
    await loginPage.waitForRole('Admin');
    await supplierPage.openCatalogs();
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('CP11: Gestión de datos de proveedores y laboratorios', async function () {
    const response = await supplierPage.fetchLaboratoriesFromApi();
    expect(response.error, 'La API debe responder sin errores de red').to.equal(undefined);
    expect(response.status).to.equal(200);
    expect(response.body).to.be.an('array');
    expect(await supplierPage.getLaboratoryCount()).to.equal(response.body.length);
    expect(await supplierPage.getLaboratoryNames()).to.deep.equal(
      response.body.map((laboratory) => laboratory.nombre)
    );

    const uniqueId = `${Date.now()}`;
    const originalName = `Selenium ${uniqueId}`;
    const updatedName = `Selenium actualizado ${uniqueId}`;

    try {
      await supplierPage.createLaboratory({
        nombre: originalName,
        pais: 'Perú',
        contacto: 'Prueba automatizada',
        telefono: '999000111',
      });
      expect(await supplierPage.getLaboratoryNames()).to.include(originalName);

      await supplierPage.editLaboratory(originalName, {
        nombre: updatedName,
        pais: 'Chile',
        contacto: 'Contacto actualizado',
        telefono: '999000222',
      });
      expect(await supplierPage.getLaboratoryNames()).to.include(updatedName);
      await supplierPage.deleteLaboratory(updatedName);
      expect(await supplierPage.getLaboratoryNames()).not.to.include(updatedName);
    } finally {
      await supplierPage.deleteLaboratoryIfPresent(originalName);
      await supplierPage.deleteLaboratoryIfPresent(updatedName);
    }
  });
});
