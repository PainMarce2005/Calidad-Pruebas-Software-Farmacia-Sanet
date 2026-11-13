const { By, until } = require('selenium-webdriver');
const { AppPage, xpathLiteral } = require('./AppPage');

class SalesPage extends AppPage {
  constructor(driver) {
    super(driver);
    this.productSearch = By.css('input[placeholder="Nombre o código del producto..."]');
    this.clientName = By.css('input[placeholder="Consumidor final"]');
    this.summary = By.xpath(
      "//main//h3[normalize-space(.)='Resumen']/ancestor::div[contains(@class,'rounded-xl')][1]"
    );
  }

  async open() {
    await this.openSection('Ventas', 'Punto de Venta (POS)');
    await this.driver.wait(until.elementLocated(this.productSearch), this.timeout);
    await this.driver.wait(async () => {
      const main = await this.driver.findElement(By.css('main'));
      return (await main.findElements(By.css('.animate-spin'))).length === 0;
    }, this.timeout, 'El catálogo de ventas no terminó de cargar.');
  }

  async getAvailableProductsFromApi() {
    const response = await this.api('/api/productos');
    if (response.status !== 200 || !Array.isArray(response.body)) {
      throw new Error(`No se pudo obtener el catálogo de productos (HTTP ${response.status}).`);
    }
    return response.body.filter((product) =>
      Number(product.stock) > 0 &&
      product.estado !== 'vencido' &&
      product.estado !== 'agotado'
    );
  }

  async getActiveClientsFromApi() {
    const response = await this.api('/api/clientes');
    if (response.status !== 200 || !Array.isArray(response.body)) {
      throw new Error(`No se pudo obtener el catálogo de clientes (HTTP ${response.status}).`);
    }
    return response.body.filter((client) => client.estado === 'Activo');
  }

  async addProductToCart(product) {
    const search = await this.driver.findElement(this.productSearch);
    await search.clear();
    await search.sendKeys(product.nombre);

    const suggestion = By.xpath(
      `//main//button[.//p[normalize-space(.)=${xpathLiteral(product.nombre)}]` +
      ` and .//p[contains(normalize-space(.),${xpathLiteral(String(product.id))})]]`
    );
    await this.driver.wait(until.elementLocated(suggestion), this.timeout);
    await this.driver.findElement(suggestion).click();

    const cartRow = By.xpath(
      `//main//h3[starts-with(normalize-space(.),'Carrito')]/following::table[1]` +
      `/tbody/tr[td[1]//p[normalize-space(.)=${xpathLiteral(product.nombre)}]]`
    );
    await this.driver.wait(until.elementLocated(cartRow), this.timeout);
    return cartRow;
  }

  async setQuantity(productName, quantity) {
    const row = By.xpath(
      `//main//h3[starts-with(normalize-space(.),'Carrito')]/following::table[1]` +
      `/tbody/tr[td[1]//p[normalize-space(.)=${xpathLiteral(productName)}]]`
    );
    const cartRow = await this.driver.wait(until.elementLocated(row), this.timeout);
    const quantityInput = await cartRow.findElement(By.css('input[type="number"]'));
    await quantityInput.clear();
    await quantityInput.sendKeys(String(quantity));
    await quantityInput.sendKeys('\t');
  }

  async selectClientByName(name) {
    const input = await this.driver.findElement(this.clientName);
    await input.clear();
    await input.sendKeys(name);

    const suggestion = By.xpath(
      `//main//h3[normalize-space(.)='Cliente']/following::button[.//p[normalize-space(.)=${xpathLiteral(name)}]][1]`
    );
    await this.driver.wait(until.elementLocated(suggestion), this.timeout);
    await this.driver.findElement(suggestion).click();
  }

  async getTotals() {
    const summary = await this.driver.findElement(this.summary);
    const readAmount = async (label) => {
      const value = await summary.findElement(By.xpath(
        `.//span[normalize-space(.)=${xpathLiteral(label)}]/following-sibling::span[1]`
      ));
      return Number((await value.getText()).replace('S/.', '').trim());
    };

    return {
      subtotal: await readAmount('Subtotal'),
      igv: await readAmount('IGV (18%)'),
      total: await readAmount('Total'),
    };
  }

  async openConfirmation() {
    const button = By.xpath("//main//button[normalize-space(.)='Realizar Venta']");
    await this.driver.wait(until.elementLocated(button), this.timeout);
    await this.driver.findElement(button).click();
    await this.driver.wait(
      until.elementLocated(By.xpath("//h2[normalize-space(.)='Confirmar Venta']")),
      this.timeout
    );
  }

  async confirmSale() {
    const button = By.xpath("//button[normalize-space(.)='Confirmar y Cobrar']");
    await this.driver.findElement(button).click();
  }

  async waitForSaleSuccess() {
    const message = await this.driver.wait(
      until.elementLocated(By.xpath("//main//p[contains(.,'registrada — S/.')]")),
      this.timeout
    );
    const text = await message.getText();
    const match = text.match(/N°\s*(\d+)/);
    if (!match) throw new Error(`No se pudo obtener el número de venta: ${text}`);
    return { id: Number(match[1]), text };
  }

  async getProductFromApi(id) {
    const response = await this.api(`/api/productos/${encodeURIComponent(id)}`);
    if (response.status !== 200) {
      throw new Error(`No se pudo consultar el producto (HTTP ${response.status}).`);
    }
    return response.body;
  }

  async getSaleFromApi(id) {
    const response = await this.api(`/api/ventas/${encodeURIComponent(id)}`);
    if (response.status !== 200) {
      throw new Error(`No se pudo consultar la venta (HTTP ${response.status}).`);
    }
    return response.body;
  }
}

module.exports = SalesPage;
