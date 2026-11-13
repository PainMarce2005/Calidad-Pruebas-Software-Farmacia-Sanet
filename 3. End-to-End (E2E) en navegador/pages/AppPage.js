const { By, until } = require('selenium-webdriver');

const DEFAULT_TIMEOUT_MS = 10000;

function xpathLiteral(value) {
  if (!value.includes("'")) return `'${value}'`;
  if (!value.includes('"')) return `"${value}"`;
  return `concat(${value.split("'").map((part, index) =>
    `${index ? `,"'",` : ''}'${part}'`
  ).join('')})`;
}

async function requestApi(driver, path, { method = 'GET', body } = {}) {
  const apiUrl = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '');
  const timeout = Number(process.env.SELENIUM_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  await driver.manage().setTimeouts({ script: timeout });

  const response = await driver.executeAsyncScript((url, requestPath, requestMethod, requestBody, done) => {
    const token = localStorage.getItem('fs_token');
    const options = {
      method: requestMethod,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(requestBody === null ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(requestBody === null ? {} : { body: JSON.stringify(requestBody) }),
    };

    fetch(`${url}${requestPath}`, options)
      .then(async (result) => {
        const text = await result.text();
        let responseBody = text;
        try {
          responseBody = text ? JSON.parse(text) : null;
        } catch {
          responseBody = text;
        }
        done({ status: result.status, body: responseBody });
      })
      .catch((error) => done({ error: error.message }));
  }, apiUrl, path, method, body === undefined ? null : body);

  if (response.error) {
    throw new Error(`Error al consultar ${path}: ${response.error}`);
  }

  return response;
}

class AppPage {
  constructor(driver) {
    this.driver = driver;
    this.timeout = Number(process.env.SELENIUM_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  }

  async openSection(menuLabel, headingLabel = menuLabel) {
    const menu = By.xpath(`//nav//button[normalize-space(.)=${xpathLiteral(menuLabel)}]`);
    await this.driver.wait(until.elementLocated(menu), this.timeout);
    await this.driver.wait(until.elementIsVisible(
      await this.driver.findElement(menu)
    ), this.timeout);
    await this.driver.findElement(menu).click();

    const heading = By.xpath(`//main//h2[normalize-space(.)=${xpathLiteral(headingLabel)}]`);
    const headingElement = await this.driver.wait(
      until.elementLocated(heading),
      this.timeout
    );
    await this.driver.wait(until.elementIsVisible(headingElement), this.timeout);
  }

  async api(path, options) {
    return requestApi(this.driver, path, options);
  }
}

module.exports = { AppPage, xpathLiteral, requestApi };
