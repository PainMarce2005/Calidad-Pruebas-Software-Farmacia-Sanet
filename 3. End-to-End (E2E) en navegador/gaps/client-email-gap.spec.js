const { By } = require('selenium-webdriver');
const { expect } = require('chai');
const { createDriver } = require('../pages/driver');
const LoginPage = require('../pages/LoginPage');
const ClientPage = require('../pages/ClientPage');
const { getCredentials } = require('../pages/credentials');

const adminCredentials = getCredentials('admin');

describe('Brecha propuesta — formulario de correo de clientes', function () {
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

  it('[CP-91] muestra el campo de correo al registrar un cliente', async function () {
    await clientPage.openNewClientForm();
    const emailInputs = await driver.findElements(
      By.xpath("//label[normalize-space(.)='Correo electrónico']/following-sibling::input")
    );

    expect(emailInputs, 'El formulario debe permitir ingresar el correo del cliente')
      .to.have.lengthOf(1);
    expect(await emailInputs[0].isDisplayed()).to.equal(true);
  });
});
