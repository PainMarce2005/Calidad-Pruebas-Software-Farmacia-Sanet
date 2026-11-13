const { By, until } = require('selenium-webdriver');
const { AppPage, xpathLiteral } = require('./AppPage');

class PurchasePage extends AppPage {
  constructor(driver) {
    super(driver);
    this.searchInput = By.css('input[placeholder="Proveedor o código..."]');
  }

  async open() {
    await this.openSection('Compras');
    await this.waitForPurchases();
  }

  async waitForPurchases() {
    await this.driver.wait(
      until.elementLocated(By.xpath("//main//th[normalize-space(.)='Código']")),
      this.timeout
    );
    await this.driver.wait(async () => {
      const main = await this.driver.findElement(By.css('main'));
      return (await main.findElements(By.css('.animate-spin'))).length === 0;
    }, this.timeout, 'La lista de compras no terminó de cargar.');
  }

  async getPurchasesFromApi() {
    const response = await this.api('/api/compras');
    if (response.status !== 200 || !Array.isArray(response.body)) {
      throw new Error(`No se pudieron consultar las compras (HTTP ${response.status}).`);
    }
    return response.body;
  }

  async createPurchase({ proveedor, fecha, total, estado = 'Pendiente', productos = '', notas = '' }) {
    await this.driver.findElement(
      By.xpath("//main//button[normalize-space(.)='Nueva Compra']")
    ).click();
    const modalHeading = By.xpath("//h2[normalize-space(.)='Nueva Compra']");
    await this.driver.wait(until.elementLocated(modalHeading), this.timeout);
    const modal = await this.driver.findElement(
      By.xpath("//h2[normalize-space(.)='Nueva Compra']/ancestor::div[contains(@class,'rounded-xl')][1]")
    );

    await modal.findElement(By.css('input[placeholder="Nombre del proveedor"]')).sendKeys(proveedor);
    const dateInput = await modal.findElement(By.css('input[type="date"]'));
    await this.driver.executeScript((input, value) => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      ).set;
      setter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, dateInput, fecha);
    await modal.findElement(By.css('input[placeholder="0.00"]')).sendKeys(String(total));
    await modal.findElement(By.css('select')).sendKeys(estado);
    await modal.findElement(By.css('input[placeholder="Ej: Paracetamol x200..."]')).sendKeys(productos);
    await modal.findElement(By.css('textarea[placeholder="Observaciones..."]')).sendKeys(notas);
    await modal.findElement(By.xpath(".//button[normalize-space(.)='Crear Compra']")).click();
  }

  async waitForSuccess(message) {
    const successLocator = By.xpath(
      `//main//p[normalize-space(.)=${xpathLiteral(message)}]`
    );
    const errorLocator = By.xpath(
      "//main//p[normalize-space(.)='Error al guardar la compra']"
    );
    await this.driver.wait(async () =>
      (await this.driver.findElements(successLocator)).length > 0 ||
      (await this.driver.findElements(errorLocator)).length > 0,
    this.timeout, 'La aplicación no mostró el resultado del registro de compra.');
    const error = await this.driver.findElements(errorLocator);
    if (error.length > 0) {
      throw new Error(`El formulario de compra informó un error: ${await error[0].getText()}`);
    }
    const toast = await this.driver.findElement(successLocator);
    return toast.getText();
  }
}

module.exports = PurchasePage;
