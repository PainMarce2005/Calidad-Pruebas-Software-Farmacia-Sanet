const { By, until } = require('selenium-webdriver');
const { AppPage, xpathLiteral } = require('./AppPage');

class ClientPage extends AppPage {
  constructor(driver) {
    super(driver);
    this.searchInput = By.css('input[placeholder="Nombre, DNI o teléfono..."]');
  }

  async open() {
    await this.openSection('Clientes');
    await this.waitForClients();
  }

  async waitForClients() {
    await this.driver.wait(
      until.elementLocated(By.xpath("//main//th[normalize-space(.)='Cliente']")),
      this.timeout
    );
    await this.driver.wait(async () => {
      const main = await this.driver.findElement(By.css('main'));
      return (await main.findElements(By.css('.animate-spin'))).length === 0;
    }, this.timeout, 'La lista de clientes no terminó de cargar.');
  }

  async openNewClientForm() {
    const button = By.xpath("//main//button[normalize-space(.)='Nuevo Cliente']");
    await this.driver.wait(until.elementLocated(button), this.timeout);
    await this.driver.findElement(button).click();
    await this.driver.wait(
      until.elementLocated(By.xpath("//h2[normalize-space(.)='Nuevo Cliente']")),
      this.timeout
    );
  }

  async fillClient({ nombre, dni = '', telefono = '', direccion = '', estado = 'Activo' }) {
    const nameInput = await this.driver.findElement(By.css('input[placeholder="Ej: Juan García López"]'));
    const dniInput = await this.driver.findElement(By.css('input[placeholder="12345678"]'));
    const phoneInput = await this.driver.findElement(By.css('input[placeholder="+51 999 000 000"]'));
    const addressInput = await this.driver.findElement(By.css('input[placeholder="Av. Los Pinos 123, Trujillo"]'));
    await nameInput.clear();
    await nameInput.sendKeys(nombre);
    await dniInput.clear();
    if (dni) await dniInput.sendKeys(dni);
    await phoneInput.clear();
    if (telefono) await phoneInput.sendKeys(telefono);
    await addressInput.clear();
    if (direccion) await addressInput.sendKeys(direccion);
    await this.driver.findElement(By.xpath(
      `//h2[normalize-space(.)='Nuevo Cliente']/ancestor::div[contains(@class,'rounded-xl')][1]//select`
    )).sendKeys(estado);
  }

  async submitClientForm() {
    await this.driver.findElement(
      By.xpath("//button[normalize-space(.)='Crear Cliente']")
    ).click();
  }

  async waitForSuccessMessage(message) {
    const toast = await this.driver.wait(
      until.elementLocated(By.xpath(`//main//p[normalize-space(.)=${xpathLiteral(message)}]`)),
      this.timeout
    );
    await this.driver.wait(until.elementIsVisible(toast), this.timeout);
    return toast.getText();
  }

  async waitForValidationMessage(message) {
    const validation = await this.driver.wait(
      until.elementLocated(By.xpath(`//h2[normalize-space(.)='Nuevo Cliente']/ancestor::div[contains(@class,'rounded-xl')][1]//p[normalize-space(.)=${xpathLiteral(message)}]`)),
      this.timeout
    );
    return validation.getText();
  }

  async search(value) {
    const input = await this.driver.findElement(this.searchInput);
    await input.clear();
    await input.sendKeys(value);
  }

  async findClientRow({ nombre, dni }) {
    const locator = By.xpath(
      `//main//table/tbody/tr[td[1]//span[normalize-space(.)=${xpathLiteral(nombre)}]` +
      ` and td[2][normalize-space(.)=${xpathLiteral(dni)}]]`
    );
    return this.driver.wait(until.elementLocated(locator), this.timeout);
  }

  async getClientFromApi(id) {
    const response = await this.api(`/api/clientes/${encodeURIComponent(id)}`);
    if (response.status !== 200) {
      throw new Error(`No se pudo consultar el cliente (HTTP ${response.status}).`);
    }
    return response.body;
  }

  async deleteClient({ nombre, dni }) {
    const row = await this.findClientRow({ nombre, dni });
    await row.findElement(By.css('button[title="Eliminar"]')).click();
    const dialog = await this.driver.wait(
      until.elementLocated(By.xpath("//h2[normalize-space(.)='Eliminar cliente']")),
      this.timeout
    );
    const dialogContainer = await dialog.findElement(
      By.xpath("./ancestor::div[contains(@class,'rounded-xl')][1]")
    );
    await dialogContainer.findElement(By.xpath(".//button[normalize-space(.)='Eliminar']")).click();
    await this.driver.wait(until.stalenessOf(row), this.timeout);
  }
}

module.exports = ClientPage;
