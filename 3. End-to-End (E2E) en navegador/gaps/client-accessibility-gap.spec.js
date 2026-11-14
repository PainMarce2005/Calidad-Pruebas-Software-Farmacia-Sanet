const { By } = require('selenium-webdriver');
const { expect } = require('chai');
const { createDriver } = require('../pages/driver');
const LoginPage = require('../pages/LoginPage');
const ClientPage = require('../pages/ClientPage');
const { getCredentials } = require('../pages/credentials');

const adminCredentials = getCredentials('admin');
const formLocator = "//h2[normalize-space(.)='Nuevo Cliente']/ancestor::div[contains(@class,'rounded-xl')][1]";

describe('Accesibilidad del formulario de clientes', function () {
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
    await clientPage.openNewClientForm();
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('CP17: asocia las etiquetas visibles con sus controles', async function () {
    const controls = await driver.findElements(
      By.xpath(`${formLocator}//input | ${formLocator}//select`)
    );
    const unlabeled = [];

    for (const control of controls) {
      const labelCount = await driver.executeScript(
        'return arguments[0].labels ? arguments[0].labels.length : 0;',
        control
      );
      if (labelCount === 0) unlabeled.push(await control.getAttribute('outerHTML'));
    }

    expect(unlabeled, 'Cada control debe tener una etiqueta programáticamente asociada')
      .to.deep.equal([]);
  });

  it('CP18: vincula el error de nombre con el campo inválido', async function () {
    await clientPage.submitClientForm();
    const nameInput = await driver.findElement(
      By.css('input[placeholder="Ej: Juan García López"]')
    );
    const invalid = await nameInput.getAttribute('aria-invalid');
    const description = await nameInput.getAttribute('aria-describedby');

    expect(invalid, 'El campo inválido debe exponer aria-invalid=true').to.equal('true');
    expect(description, 'El error debe estar asociado con el campo').to.be.a('string').and.not.empty;
  });

  it('CP19: mueve el foco al primer campo al abrir el formulario', async function () {
    const nameInput = await driver.findElement(
      By.css('input[placeholder="Ej: Juan García López"]')
    );
    const focused = await driver.executeScript(
      'return document.activeElement === arguments[0];',
      nameInput
    );

    expect(focused, 'El primer campo debe recibir el foco al abrir el modal').to.equal(true);
  });
});
