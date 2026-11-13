const { expect } = require('chai');
const { createDriver } = require('../pages/driver');
const LoginPage = require('../pages/LoginPage');
const { AppPage } = require('../pages/AppPage');
const { getCredentials } = require('../pages/credentials');

describe('Historial de accesos', function () {
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

  it('CP16: Registro de intentos fallidos de acceso', async function () {
    const email = `cp16-${Date.now()}@farmacia.com`;
    await loginPage.login(email, 'ClaveIncorrecta123!');
    expect(await loginPage.waitForLoginError()).to.equal('Credenciales inválidas.');

    const admin = getCredentials('admin');
    await loginPage.login(admin.email, admin.password);
    await loginPage.waitForRole('Admin');
    await appPage.openSection('Historial de Accesos');

    const result = await appPage.api(
      `/api/auth/historial?resultado=Fallido&email=${encodeURIComponent(email)}`
    );
    expect(result.status).to.equal(200);
    expect(result.body.registros).to.have.lengthOf(1);
    expect(result.body.registros[0].email).to.equal(email);
    expect(result.body.registros[0].resultado).to.equal('Fallido');
  });
});
