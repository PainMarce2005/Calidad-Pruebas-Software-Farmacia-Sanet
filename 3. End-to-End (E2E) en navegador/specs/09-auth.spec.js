const { expect } = require('chai');
const { createDriver } = require('../pages/driver');
const LoginPage = require('../pages/LoginPage');
const { AppPage } = require('../pages/AppPage');
const { getCredentials } = require('../pages/credentials');

const roles = [
  { role: 'admin', label: 'Admin', canViewCatalogs: true },
  { role: 'supervisor', label: 'Supervisor', canViewCatalogs: true },
  { role: 'seller', label: 'Vendedor', canViewCatalogs: false },
];

describe('Autenticación y permisos', function () {
  this.timeout(60000);

  let driver;
  let loginPage;
  let appPage;

  before(async function () {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    appPage = new AppPage(driver);
  });

  beforeEach(async function () {
    await loginPage.open();
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('CP13: Inicio de sesión de usuario', async function () {
    const admin = getCredentials('admin');
    await loginPage.login(admin.email, admin.password);
    expect(await loginPage.waitForRole('Admin')).to.equal('Admin');
  });

  it('CP14: Control de acceso por roles de usuario', async function () {
    for (const entry of roles) {
      const credentials = getCredentials(entry.role);
      await loginPage.open();
      await loginPage.login(credentials.email, credentials.password);
      expect(await loginPage.waitForRole(entry.label)).to.equal(entry.label);
      expect(await loginPage.isMenuVisible('Catálogos')).to.equal(entry.canViewCatalogs);
    }
  });

});
