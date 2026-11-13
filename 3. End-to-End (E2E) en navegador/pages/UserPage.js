const { By, until } = require('selenium-webdriver');
const { AppPage, xpathLiteral } = require('./AppPage');

class UserPage extends AppPage {
  async open() {
    await this.openSection('Usuarios');
    await this.driver.wait(
      until.elementLocated(By.xpath("//main//th[normalize-space(.)='Usuario']")),
      this.timeout
    );
  }

  async openNewUserForm() {
    await this.driver.findElement(
      By.xpath("//main//button[normalize-space(.)='Nuevo Usuario']")
    ).click();
    await this.driver.wait(
      until.elementLocated(By.xpath("//h2[normalize-space(.)='Nuevo Usuario']")),
      this.timeout
    );
  }

  async createUser({ nombre, email, password, rol = 'Vendedor' }) {
    await this.driver.findElement(By.css('input[placeholder="Ej: María González"]')).sendKeys(nombre);
    const emailInput = await this.driver.findElement(
      By.css('input[placeholder="usuario@farmacia.com"]')
    );
    await emailInput.sendKeys(email);
    await this.driver.wait(async () => {
      const modal = await this.driver.findElement(
        By.xpath("//h2[normalize-space(.)='Nuevo Usuario']/ancestor::div[contains(@class,'rounded-xl')][1]")
      );
      return (await modal.getText()).includes('Email disponible');
    }, this.timeout, 'El sistema no confirmó que el email esté disponible.');

    const selects = await this.driver.findElements(
      By.xpath("//h2[normalize-space(.)='Nuevo Usuario']/ancestor::div[contains(@class,'rounded-xl')][1]//select")
    );
    await selects[0].sendKeys(rol);

    const passwords = await this.driver.findElements(
      By.xpath("//h2[normalize-space(.)='Nuevo Usuario']/ancestor::div[contains(@class,'rounded-xl')][1]//input[@type='password']")
    );
    await passwords[0].sendKeys(password);
    await passwords[1].sendKeys(password);
    await this.driver.findElement(
      By.xpath("//button[normalize-space(.)='Crear Usuario']")
    ).click();
  }

  async waitForUserRow(email) {
    const row = By.xpath(
      `//main//table/tbody/tr[td[2][normalize-space(.)=${xpathLiteral(email)}]]`
    );
    return this.driver.wait(until.elementLocated(row), this.timeout);
  }

  async getUserFromApi(id) {
    const response = await this.api(`/api/usuarios/${encodeURIComponent(id)}`);
    if (response.status !== 200) {
      throw new Error(`No se pudo consultar el usuario (HTTP ${response.status}).`);
    }
    return response.body;
  }

  async waitForSuccessMessage(message) {
    const toast = await this.driver.wait(
      until.elementLocated(By.xpath(`//main//p[normalize-space(.)=${xpathLiteral(message)}]`)),
      this.timeout
    );
    return toast.getText();
  }
}

module.exports = UserPage;
