const { expect } = require('chai');
const { createDriver } = require('../pages/driver');
const LoginPage = require('../pages/LoginPage');
const ClientPage = require('../pages/ClientPage');
const { getCredentials } = require('../pages/credentials');

const adminCredentials = getCredentials('admin');

describe('Gestión de clientes', function () {
  this.timeout(60000);

  let driver;
  let loginPage;
  let clientPage;

  before(async function () {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    clientPage = new ClientPage(driver);
  });

  beforeEach(async function () {
    await loginPage.open();
    await loginPage.login(adminCredentials.email, adminCredentials.password);
    await loginPage.waitForRole('Admin');
    await clientPage.open();
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('CP4: Registro de datos del cliente', async function () {
    const dni = String(10000000 + Math.floor(Math.random() * 90000000));
    const nombre = `Cliente CP4 ${dni}`;
    let clientId;

    try {
      await clientPage.openNewClientForm();
      await clientPage.fillClient({
        nombre,
        dni,
        telefono: '999000111',
        direccion: 'Dirección de prueba CP4',
      });
      await clientPage.submitClientForm();
      expect(await clientPage.waitForSuccessMessage('Cliente creado correctamente'))
        .to.equal('Cliente creado correctamente');

      const listResponse = await clientPage.api('/api/clientes');
      expect(listResponse.status).to.equal(200);
      const createdClient = listResponse.body.find((client) => client.dni === dni);
      expect(createdClient, 'El cliente debe persistirse en MySQL').to.exist;
      clientId = createdClient.id;

      const persistedClient = await clientPage.getClientFromApi(clientId);
      expect(persistedClient).to.include({
        nombre,
        dni,
        telefono: '999000111',
        direccion: 'Dirección de prueba CP4',
        estado: 'Activo',
      });

      await clientPage.search(dni);
      expect(await (await clientPage.findClientRow({ nombre, dni })).isDisplayed()).to.equal(true);
    } finally {
      const listResponse = await clientPage.api('/api/clientes');
      expect(listResponse.status).to.equal(200);
      const record = listResponse.body.find((client) => client.dni === dni);
      const cleanupId = clientId || record?.id;
      if (cleanupId) {
        const cleanup = await clientPage.api(`/api/clientes/${cleanupId}`, { method: 'DELETE' });
        expect([200, 404]).to.include(cleanup.status);
      }
    }
  });

});
