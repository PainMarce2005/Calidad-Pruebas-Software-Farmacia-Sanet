const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const edge = require('selenium-webdriver/edge');

async function createDriver() {
  const browser = (process.env.SELENIUM_BROWSER || 'chrome').toLowerCase();
  const headless = process.env.HEADLESS !== 'false';
  const browserName = browser === 'edge' || browser === 'microsoftedge'
    ? 'MicrosoftEdge'
    : browser;
  const builder = new Builder().forBrowser(browserName);

  if (browser === 'chrome') {
    const options = new chrome.Options().addArguments('--window-size=1440,1000');
    if (headless) options.addArguments('--headless=new');
    builder.setChromeOptions(options);
  } else if (browserName === 'MicrosoftEdge') {
    const options = new edge.Options().addArguments('--window-size=1440,1000');
    if (headless) options.addArguments('--headless=new');
    builder.setEdgeOptions(options);
  } else {
    throw new Error(`Navegador no compatible: ${browser}. Usa chrome o edge.`);
  }

  return builder.build();
}

module.exports = { createDriver };
