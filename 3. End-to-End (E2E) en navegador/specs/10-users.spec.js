const { expect } = require('chai');
const { createDriver } = require('../pages/driver');
const LoginPage = require('../pages/LoginPage');
const UserPage = require('../pages/UserPage');
const { getCredentials } = require('../pages/credentials');

const adminCredentials = getCredentials('admin');

describe('Administración de usuarios', function () {
  this.timeout(60000);

  let driver;
  let loginPage;
  let userPage;

  before(async function () {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    userPage = new UserPage(driver);
  });

  beforeEach(async function () {
    await loginPage.open();
    await loginPage.login(adminCredentials.email, adminCredentials.password);
    await loginPage.waitForRole('Admin');
    await userPage.open();
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('CP15: Gestión de usuarios del sistema', async function () {
    const uniqueId = Date.now();
    const email = `cp19-${uniqueId}@farmacia.com`;
    const nombre = `Usuario CP19 ${uniqueId}`;
    let userId;

    try {
      await userPage.openNewUserForm();
      await userPage.createUser({
        nombre,
        email,
        password: `Test${uniqueId}!`,
        rol: 'Vendedor',
      });
      expect(await userPage.waitForSuccessMessage('Usuario creado exitosamente'))
        .to.equal('Usuario creado exitosamente');

      const row = await userPage.waitForUserRow(email);
      expect(await row.getText()).to.include(nombre);
      expect(await row.getText()).to.include('Vendedor');

      const users = await userPage.api('/api/usuarios');
      expect(users.status).to.equal(200);
      const createdUser = users.body.find((user) => user.email === email);
      expect(createdUser, 'El usuario debe persistirse en MySQL').to.exist;
      userId = createdUser.id;

      const persisted = await userPage.getUserFromApi(userId);
      expect(persisted).to.include({
        nombre,
        email,
        rol: 'Vendedor',
        estado: 'Activo',
      });
    } finally {
      const users = await userPage.api('/api/usuarios');
      expect(users.status).to.equal(200);
      const persisted = users.body.find((user) => user.email === email);
      const id = userId || persisted?.id;
      if (id) {
        const cleanup = await userPage.api(`/api/usuarios/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        expect(cleanup.status).to.equal(200);
      }
    }
  });
});
