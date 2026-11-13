const { expect } = require('chai');
const { By } = require('selenium-webdriver');
const { createDriver } = require('../pages/driver');
const LoginPage = require('../pages/LoginPage');
const ProductPage = require('../pages/ProductPage');
const { getCredentials } = require('../pages/credentials');

const adminCredentials = getCredentials('admin');

describe('Catálogo de productos y categorías', function () {
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

  it('CP10: Administración del catálogo de productos y categorías', async function () {
    const products = await productPage.getProductsFromApi();
    expect(products).to.be.an('array').that.is.not.empty;
    const target = products.find((product) => !String(product.id).startsWith('E'));
    expect(target, 'Debe existir al menos un producto del catálogo').to.exist;

    await productPage.search(String(target.id));
    await productPage.findProductRow(target.id);
    expect(await productPage.getVisibleProductIds()).to.deep.equal([String(target.id)]);

    await productPage.search('__sin_resultados__');
    expect(await productPage.getNoResultsMessage()).to.equal('No se encontraron productos');

    const laboratory = target.laboratorio;
    await productPage.search('');
    await productPage.filterByLaboratory(laboratory);
    const matchingIds = products
      .filter((product) => product.laboratorio === laboratory)
      .map((product) => String(product.id));
    await productPage.waitForProductIds(matchingIds);

    const editModal = await productPage.openProductEdit(target.id);
    const nameInput = await editModal.findElement(
      By.css('input[placeholder="Ej: Paracetamol 500mg"]')
    );
    expect(await nameInput.getAttribute('value')).to.equal(target.nombre);
    await editModal.findElement(
      By.xpath(".//button[normalize-space(.)='Cancelar']")
    ).click();
  });
});
