const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });
require('dotenv').config({
  path: path.join(__dirname, '..', '..', 'backend', '.env'),
  quiet: true,
});

const { expect } = require('chai');
const request = require('supertest');
const app = require('../../backend/index');

const adminCredentials = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@farmacia.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'Admin123!',
};

const uniqueSuffix = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const api = (method, path, token) =>
  request(app)[method](path).set('Authorization', `Bearer ${token}`);

async function login() {
  return request(app).post('/api/auth/login').send(adminCredentials);
}

describe('Brecha propuesta — correo de clientes', function () {
  this.timeout(15000);

  let adminToken;
  const createdClientIds = [];

  before(async function () {
    const response = await login();
    expect(response.status, JSON.stringify(response.body)).to.equal(200);
    adminToken = response.body.token;
  });

  afterEach(async function () {
    for (const id of createdClientIds.splice(0)) {
      const response = await api('delete', `/api/clientes/${id}`, adminToken);
      expect(response.status, JSON.stringify(response.body)).to.equal(200);
    }
  });

  after(async function () {
    await require('../../backend/db').end();
  });

  it('[CP-89] crea un cliente y devuelve el correo persistido', async function () {
    const suffix = uniqueSuffix();
    const email = `cliente-${suffix}@example.test`;
    const creation = await api('post', '/api/clientes', adminToken).send({
      nombre: `Cliente email ${suffix}`,
      dni: String(10000000 + Math.floor(Math.random() * 89999999)),
      email,
      estado: 'Activo',
    });

    expect(creation.status, JSON.stringify(creation.body)).to.equal(201);
    createdClientIds.push(creation.body.id);

    const detail = await api('get', `/api/clientes/${creation.body.id}`, adminToken);
    expect(detail.status, JSON.stringify(detail.body)).to.equal(200);
    expect(detail.body.email, 'el correo debe guardarse y devolverse al consultar el cliente')
      .to.equal(email);
  });

  it('[CP-90] actualiza y devuelve el correo del cliente', async function () {
    const suffix = uniqueSuffix();
    const email = `actualizado-${suffix}@example.test`;
    const creation = await api('post', '/api/clientes', adminToken).send({
      nombre: `Cliente email ${suffix}`,
      dni: String(10000000 + Math.floor(Math.random() * 89999999)),
      estado: 'Activo',
    });

    expect(creation.status, JSON.stringify(creation.body)).to.equal(201);
    createdClientIds.push(creation.body.id);

    const update = await api('put', `/api/clientes/${creation.body.id}`, adminToken).send({
      nombre: `Cliente email ${suffix}`,
      email,
      estado: 'Activo',
    });
    expect(update.status, JSON.stringify(update.body)).to.equal(200);

    const detail = await api('get', `/api/clientes/${creation.body.id}`, adminToken);
    expect(detail.status, JSON.stringify(detail.body)).to.equal(200);
    expect(detail.body.email, 'el correo actualizado debe persistir y devolverse')
      .to.equal(email);
  });
});
