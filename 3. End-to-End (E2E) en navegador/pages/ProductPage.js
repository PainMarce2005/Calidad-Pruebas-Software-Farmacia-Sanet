const { By, Key, until } = require('selenium-webdriver');
const { Select } = require('selenium-webdriver/lib/select');
const { AppPage, xpathLiteral } = require('./AppPage');

class ProductPage extends AppPage {
  constructor(driver) {
    super(driver);
    this.table = By.xpath("//main//h2[normalize-space(.)='Inventario']/following::table[1]");
    this.searchInput = By.css('input[placeholder="Nombre o código..."]');
    this.laboratoryFilter = By.xpath(
      "//main//label[normalize-space(.)='Laboratorio']/following::select[1]"
    );
  }

  async open() {
    await this.openSection('Inventario');
    await this.waitForProducts();
  }

  async waitForProducts() {
    await this.driver.wait(until.elementLocated(this.table), this.timeout);
    await this.driver.wait(async () => {
      const main = await this.driver.findElement(By.css('main'));
      return (await main.findElements(By.css('.animate-spin'))).length === 0;
    }, this.timeout, 'El inventario no terminó de cargar.');
  }

  async getProductsFromApi() {
    const response = await this.api('/api/productos');
    if (response.status !== 200 || !Array.isArray(response.body)) {
      throw new Error(`No se pudo obtener el inventario (HTTP ${response.status}).`);
    }
    return response.body;
  }

  async getRows() {
    const table = await this.driver.findElement(this.table);
    return table.findElements(By.css('tbody tr'));
  }

  async findProductRow(productId) {
    const locator = By.xpath(
      `//main//h2[normalize-space(.)='Inventario']/following::table[1]` +
      `/tbody/tr[td[1]//span[normalize-space(.)=${xpathLiteral(String(productId))}]]`
    );
    return this.driver.wait(until.elementLocated(locator), this.timeout);
  }

  async search(value) {
    const input = await this.driver.findElement(this.searchInput);
    await input.sendKeys(Key.chord(Key.CONTROL, 'a'), Key.BACK_SPACE);
    if (value) await input.sendKeys(value);
  }

  async filterByLaboratory(name) {
    const filter = await this.driver.findElement(this.laboratoryFilter);
    await new Select(filter).selectByVisibleText(name);
  }

  async resetLaboratoryFilter() {
    const filter = await this.driver.findElement(this.laboratoryFilter);
    await new Select(filter).selectByValue('todos');
  }

  async getVisibleProductIds() {
    const rows = await this.getRows();
    const ids = [];
    for (const row of rows) {
      const cells = await row.findElements(By.css('td'));
      if (cells.length === 9) {
        ids.push((await cells[0].getText()).trim());
      }
    }
    return ids;
  }

  async waitForProductIds(expectedIds) {
    await this.driver.wait(async () => {
      const actualIds = await this.getVisibleProductIds();
      return actualIds.length === expectedIds.length &&
        actualIds.every((id, index) => id === expectedIds[index]);
    }, this.timeout, 'Los productos visibles no coinciden con el filtro aplicado.');
  }

  async getVisibleProductData(productId) {
    const row = await this.findProductRow(productId);
    const cells = await row.findElements(By.css('td'));
    const state = (await cells[7].getText()).trim();
    const stockCell = await cells[4].getText();
    const [stock, minimum] = stockCell.match(/\d+/g).map(Number);

    return {
      id: (await cells[0].getText()).trim(),
      name: (await cells[1].getText()).trim(),
      laboratory: (await cells[2].getText()).trim(),
      stock,
      minimum,
      state,
    };
  }

  async openProductDetails(productId) {
    const row = await this.findProductRow(productId);
    await row.findElement(By.css('button[title="Ver detalles"]')).click();
    const heading = await this.driver.wait(
      until.elementLocated(By.xpath("//h2[normalize-space(.)='Detalles del Producto']")),
      this.timeout
    );
    await this.driver.wait(until.elementIsVisible(heading), this.timeout);
    return this.driver.findElement(
      By.xpath("//h2[normalize-space(.)='Detalles del Producto']/ancestor::div[contains(@class,'rounded-xl')][1]")
    );
  }

  async openProductEdit(productId) {
    const row = await this.findProductRow(productId);
    await row.findElement(By.css('button[title="Editar"]')).click();
    const heading = await this.driver.wait(
      until.elementLocated(By.xpath("//h2[normalize-space(.)='Editar Producto']")),
      this.timeout
    );
    await this.driver.wait(until.elementIsVisible(heading), this.timeout);
    return this.driver.findElement(
      By.xpath("//h2[normalize-space(.)='Editar Producto']/ancestor::div[contains(@class,'rounded-xl')][1]")
    );
  }

  async getLowStockProductIds() {
    const rows = await this.getRows();
    const ids = [];

    for (const row of rows) {
      const cells = await row.findElements(By.css('td'));
      if (cells.length !== 9 || (await cells[7].getText()).trim() !== 'Stock Bajo') continue;
      ids.push((await cells[0].getText()).trim());
    }

    return ids;
  }

  async getNoResultsMessage() {
    const message = await this.driver.wait(
      until.elementLocated(By.xpath("//main//td[normalize-space(.)='No se encontraron productos']")),
      this.timeout
    );
    return message.getText();
  }
}

module.exports = ProductPage;
