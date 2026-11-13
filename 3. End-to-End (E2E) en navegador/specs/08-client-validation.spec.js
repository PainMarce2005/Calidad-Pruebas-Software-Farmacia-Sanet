const { expect } = require('chai');
const { createDriver } = require('../pages/driver');
const LoginPage = require('../pages/LoginPage');
const ClientPage = require('../pages/ClientPage');
const { getCredentials } = require('../pages/credentials');

const adminCredentials = getCredentials('admin');

describe('Validación de formularios', function () {
  this.timeout(60000);

  let driver;
  let loginPage;
  let clientPage;

  before(async function () {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    clientPage = new ClientPage(driver);
  });

  beforeEach(async function () {
    await loginPage.open();
    await loginPage.login(adminCredentials.email, adminCredentials.password);
    await loginPage.waitForRole('Admin');
    await clientPage.open();
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('CP12: Validación de campos obligatorios en formularios', async function () {
    await clientPage.openNewClientForm();
    await clientPage.fillClient({ nombre: '' });
    await clientPage.submitClientForm();

    expect(await clientPage.waitForValidationMessage('El nombre es obligatorio'))
      .to.equal('El nombre es obligatorio');
  });
});
