const { By, until } = require('selenium-webdriver');

const DEFAULT_TIMEOUT_MS = 10000;

class LoginPage {
  constructor(driver) {
    this.driver = driver;
    this.baseUrl = process.env.BASE_URL || 'http://localhost:5173/';
    this.timeout = Number(process.env.SELENIUM_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
    this.emailInput = By.css('input[type="email"]');
    this.passwordInput = By.css('input[type="password"]');
    this.submitButton = By.xpath("//button[.//span[normalize-space(.)='Iniciar Sesión']]");
  }

  async open() {
    await this.driver.get(this.baseUrl);
    await this.driver.executeScript(() => {
      localStorage.removeItem('fs_token');
      localStorage.removeItem('fs_usuario');
      localStorage.removeItem('fs_login_at');
    });
    await this.driver.navigate().refresh();
    await this.driver.wait(until.elementLocated(this.emailInput), this.timeout);
    await this.driver.wait(until.elementIsVisible(
      await this.driver.findElement(this.emailInput)
    ), this.timeout);
  }

  async login(email, password) {
    const emailInput = await this.driver.findElement(this.emailInput);
    const passwordInput = await this.driver.findElement(this.passwordInput);

    await emailInput.clear();
    await emailInput.sendKeys(email);
    await passwordInput.clear();
    await passwordInput.sendKeys(password);
    await this.driver.findElement(this.submitButton).click();
  }

  async waitForLoginError() {
    const error = await this.driver.wait(
      until.elementLocated(By.css('form p.text-red-400')),
      this.timeout
    );
    await this.driver.wait(until.elementIsVisible(error), this.timeout);
    return error.getText();
  }

  async waitForRole(roleLabel) {
    const heading = await this.driver.wait(
      until.elementLocated(By.xpath("//aside//h1[normalize-space(.)='Farmacia Sanet']")),
      this.timeout
    );
    await this.driver.wait(until.elementIsVisible(heading), this.timeout);

    const role = await this.driver.wait(
      until.elementLocated(By.xpath(`//aside//span[normalize-space(.)='${roleLabel}']`)),
      this.timeout
    );
    await this.driver.wait(until.elementIsVisible(role), this.timeout);
    return role.getText();
  }

  async isMenuVisible(label) {
    const menuItems = await this.driver.findElements(
      By.xpath(`//nav//button[normalize-space(.)='${label}']`)
    );

    for (const item of menuItems) {
      if (await item.isDisplayed()) return true;
    }

    return false;
  }
}

module.exports = LoginPage;
