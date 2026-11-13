const { By, until } = require('selenium-webdriver');

const DEFAULT_TIMEOUT_MS = 10000;

function xpathLiteral(value) {
  if (!value.includes("'")) return `'${value}'`;
  if (!value.includes('"')) return `"${value}"`;
  return `concat(${value.split("'").map((part, index) =>
    `${index ? `,"'",` : ''}'${part}'`
  ).join('')})`;
}

class SupplierPage {
  constructor(driver) {
    this.driver = driver;
    this.timeout = Number(process.env.SELENIUM_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
    this.apiUrl = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '');
    this.laboratoriesHeading = By.xpath("//h3[normalize-space(.)='Laboratorios']");
    this.section = By.xpath(
      "//h3[normalize-space(.)='Laboratorios']/ancestor::div[contains(@class,'rounded-xl')][1]"
    );
  }

  async openCatalogs() {
    const catalogMenu = By.xpath("//nav//button[normalize-space(.)='Catálogos']");
    await this.driver.wait(until.elementLocated(catalogMenu), this.timeout);
    await this.driver.findElement(catalogMenu).click();
    await this.driver.wait(
      until.elementLocated(By.xpath("//h2[normalize-space(.)='Catálogos']")),
      this.timeout
    );
    await this.waitForLaboratories();
  }

  async waitForLaboratories() {
    const heading = await this.driver.wait(
      until.elementLocated(this.laboratoriesHeading),
      this.timeout
    );
    await this.driver.wait(until.elementIsVisible(heading), this.timeout);

    await this.driver.wait(async () => {
      const section = await this.driver.findElement(this.section);
      return (await section.findElements(By.css('.animate-spin'))).length === 0;
    }, this.timeout, 'La lista de laboratorios no terminó de cargar.');
  }

  async getLaboratoryCount() {
    const section = await this.driver.findElement(this.section);
    const count = await section.findElement(
      By.xpath(".//h3[normalize-space(.)='Laboratorios']/following-sibling::span[1]")
    );
    return Number(await count.getText());
  }

  async getLaboratoryNames() {
    const section = await this.driver.findElement(this.section);
    const rows = await section.findElements(
      By.xpath(".//div[contains(@class,'rounded-lg') and contains(@class,'p-4')]/div/div/p[1]")
    );
    const names = [];

    for (const row of rows) {
      names.push(await row.getText());
    }

    return names;
  }

  async fetchLaboratoriesFromApi() {
    await this.driver.manage().setTimeouts({ script: this.timeout });

    return this.driver.executeAsyncScript((apiUrl, done) => {
      const token = localStorage.getItem('fs_token');
      fetch(`${apiUrl}/api/laboratorios`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(async (response) => {
        done({ status: response.status, body: await response.json() });
      }).catch((error) => {
        done({ error: error.message });
      });
    }, this.apiUrl);
  }

  async createLaboratory({ nombre, pais, contacto = '', telefono = '' }) {
    const section = await this.driver.findElement(this.section);
    await section.findElement(By.xpath(".//button[normalize-space(.)='Nuevo']")).click();
    const modal = await this.driver.wait(
      until.elementLocated(By.xpath("//h2[normalize-space(.)='Nuevo Laboratorio']/ancestor::div[contains(@class,'rounded-xl')][1]")),
      this.timeout
    );

    await modal.findElement(By.css('input[placeholder="Ej: Bayer"]')).sendKeys(nombre);
    await modal.findElement(By.css('input[placeholder="Ej: Alemania"]')).sendKeys(pais);
    await modal.findElement(By.css('input[placeholder="Nombre del representante"]')).sendKeys(contacto);
    await modal.findElement(By.css('input[placeholder="+51 999 000 000"]')).sendKeys(telefono);
    await modal.findElement(By.xpath(".//button[normalize-space(.)='Crear']")).click();
    await this.driver.wait(
      until.elementLocated(By.xpath("//p[normalize-space(.)='Laboratorio creado']")),
      this.timeout
    );
    await this.waitForLaboratories();
    await this.driver.wait(
      until.elementLocated(this.laboratoryRowLocator(nombre)),
      this.timeout,
      `No se mostró el laboratorio creado: ${nombre}`
    );
  }

  async editLaboratory(currentName, { nombre, pais, contacto = '', telefono = '' }) {
    const row = await this.findLaboratoryRow(currentName);
    await row.findElement(By.xpath(".//button[1]")).click();
    const modal = await this.driver.wait(
      until.elementLocated(By.xpath("//h2[normalize-space(.)='Editar Laboratorio']/ancestor::div[contains(@class,'rounded-xl')][1]")),
      this.timeout
    );

    const nameInput = await modal.findElement(By.css('input[placeholder="Ej: Bayer"]'));
    const countryInput = await modal.findElement(By.css('input[placeholder="Ej: Alemania"]'));
    const contactInput = await modal.findElement(By.css('input[placeholder="Nombre del representante"]'));
    const phoneInput = await modal.findElement(By.css('input[placeholder="+51 999 000 000"]'));
    await nameInput.clear();
    await nameInput.sendKeys(nombre);
    await countryInput.clear();
    await countryInput.sendKeys(pais);
    await contactInput.clear();
    await contactInput.sendKeys(contacto);
    await phoneInput.clear();
    await phoneInput.sendKeys(telefono);
    await modal.findElement(By.xpath(".//button[normalize-space(.)='Guardar']")).click();
    await this.driver.wait(
      until.elementLocated(By.xpath("//p[normalize-space(.)='Laboratorio actualizado']")),
      this.timeout
    );
    await this.waitForLaboratories();
    await this.driver.wait(
      until.elementLocated(this.laboratoryRowLocator(nombre)),
      this.timeout,
      `No se mostró el laboratorio actualizado: ${nombre}`
    );
  }

  async deleteLaboratory(name) {
    const row = await this.findLaboratoryRow(name);
    await row.findElement(By.xpath(".//button[2]")).click();
    const dialog = await this.driver.wait(
      until.elementLocated(By.xpath("//h2[normalize-space(.)='Confirmar Eliminación']/ancestor::div[contains(@class,'rounded-xl')][1]")),
      this.timeout
    );
    await dialog.findElement(By.xpath(".//button[normalize-space(.)='Eliminar']")).click();
    await this.driver.wait(until.stalenessOf(row), this.timeout);
  }

  async deleteLaboratoryIfPresent(name) {
    const rows = await this.driver.findElements(this.laboratoryRowLocator(name));
    if (rows.length > 0 && await rows[0].isDisplayed()) {
      await this.deleteLaboratory(name);
    }
  }

  async findLaboratoryRow(name) {
    return this.driver.wait(
      until.elementLocated(this.laboratoryRowLocator(name)),
      this.timeout
    );
  }

  laboratoryRowLocator(name) {
    return By.xpath(
      `//h3[normalize-space(.)='Laboratorios']/ancestor::div[contains(@class,'rounded-xl')][1]` +
      `//div[contains(@class,'rounded-lg') and contains(@class,'p-4')][.//p[normalize-space(.)=${xpathLiteral(name)}]]`
    );
  }
}

module.exports = SupplierPage;
