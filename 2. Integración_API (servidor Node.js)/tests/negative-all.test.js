const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });
require('dotenv').config({
  path: path.join(__dirname, '..', '..', 'backend', '.env'),
  quiet: true,
});

const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../backend/index');

const adminCredentials = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@farmacia.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'Admin123!',
};
const jwtSecret = process.env.JWT_SECRET || 'farmacia_sanet_secret_key_change_in_prod';
const uniqueSuffix = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const created = {
  products: [],
  users: [],
  clients: [],
  categories: [],
  laboratories: [],
  purchases: [],
};

const authorized = (method, path, token) =>
  request(app)[method](path).set('Authorization', `Bearer ${token}`);

async function login(credentials) {
  return request(app).post('/api/auth/login').send(credentials);
}

function productPayload(id, overrides = {}) {
  return {
    id,
    nombre: `Prueba QA ${id}`,
    descripcion: 'Fixture temporal de prueba negativa',
    laboratorio: 'QA',
    lote: 'QA',
    stock: 1,
    stock_minimo: 1,
    precio: 1,
    vencimiento: '2030-12-31',
    estado: 'activo',
    categoria: '',
    ...overrides,
  };
}

describe('Pruebas negativas por módulo (comportamiento ideal)', function () {
  this.timeout(30000);

  let adminToken;
  let adminUserId;

  before(async function () {
    const response = await login(adminCredentials);
    expect(response.status, JSON.stringify(response.body)).to.equal(200);
    adminToken = response.body.token;
    adminUserId = jwt.verify(adminToken, jwtSecret).id;
  });

  after(async function () {
    const database = require('../../backend/patterns/DatabaseSingleton');
    const pool = require('../../backend/db');

    for (const productId of created.products) {
      await database.query('DELETE FROM productos WHERE id = ?', [productId]);
    }
    for (const userId of created.users) {
      await pool.query('DELETE FROM usuarios WHERE id = ?', [userId]);
    }
    for (const clientId of created.clients) {
      await pool.query('DELETE FROM clientes WHERE id = ?', [clientId]);
    }
    for (const categoryId of created.categories) {
      await pool.query('DELETE FROM categorias WHERE id = ?', [categoryId]);
    }
    for (const laboratoryId of created.laboratories) {
      await pool.query('DELETE FROM laboratorios WHERE id = ?', [laboratoryId]);
    }
    for (const purchaseId of created.purchases) {
      await database.query('DELETE FROM compras WHERE id = ?', [purchaseId]);
    }

    await Promise.all([pool.end(), database.close()]);
  });

  describe('Módulo de productos', function () {
    it('rechaza la creación de un producto con stock negativo (esperado HTTP 400)', async function () {
      const id = `NA${uniqueSuffix()}`;
      const response = await authorized('post', '/api/productos', adminToken)
        .send(productPayload(id, { stock: -1, stock_minimo: 0 }));
      if (response.status === 201) created.products.push(id);
      expect(response.status, JSON.stringify(response.body)).to.equal(400);
    });

    it('rechaza la creación de un producto con precio negativo (esperado HTTP 400)', async function () {
      const id = `NA${uniqueSuffix()}`;
      const response = await authorized('post', '/api/productos', adminToken)
        .send(productPayload(id, { precio: -1 }));
      if (response.status === 201) created.products.push(id);
      expect(response.status, JSON.stringify(response.body)).to.equal(400);
    });

    it('rechaza la creación de un producto sin nombre (esperado HTTP 400)', async function () {
      const response = await authorized('post', '/api/productos', adminToken)
        .send(productPayload(`NA${uniqueSuffix()}`, { nombre: '' }));
      expect(response.status, JSON.stringify(response.body)).to.equal(400);
    });

    it('responde HTTP 404 al actualizar un producto inexistente', async function () {
      const response = await authorized(
        'put',
        `/api/productos/NO-${uniqueSuffix()}`,
        adminToken
      ).send(productPayload('ignored'));
      expect(response.status, JSON.stringify(response.body)).to.equal(404);
    });

    it('rechaza la creación de un producto con stock cero (esperado HTTP 400)', async function () {
      const id = `NA${uniqueSuffix()}`;
      const response = await authorized('post', '/api/productos', adminToken)
        .send(productPayload(id, { stock: 0, stock_minimo: 0 }));
      if (response.status === 201) created.products.push(id);
      expect(response.status, JSON.stringify(response.body)).to.equal(400);
    });
  });

  describe('Módulo de ventas', function () {
    it('rechaza una venta con más existencias que el stock disponible', async function () {
      const products = await authorized('get', '/api/productos', adminToken);
      expect(products.status).to.equal(200);
      const product = products.body.find(
        (item) => Number(item.stock) > 0 && item.estado !== 'vencido'
      );
      expect(product, 'Se requiere un producto vendible con stock positivo').to.exist;

      const response = await authorized('post', '/api/ventas', adminToken).send({
        tipo_doc: 'Boleta',
        metodo_pago: 'Efectivo',
        usuario_id: adminUserId,
        items: [{
          producto_id: product.id,
          producto_nombre: product.nombre,
          cantidad: Number(product.stock) + 1,
          precio_unit: Number(product.precio),
        }],
      });
      expect(response.status, JSON.stringify(response.body)).to.equal(400);
    });

    it('rechaza vender con cantidad negativa (esperado HTTP 400)', async function () {
      const response = await authorized('post', '/api/ventas', adminToken).send({
        tipo_doc: 'Boleta',
        metodo_pago: 'Efectivo',
        usuario_id: adminUserId,
        items: [{ producto_id: 'no-existe', cantidad: -1, precio_unit: 1 }],
      });
      expect(response.status, JSON.stringify(response.body)).to.equal(400);
    });

    it('rechaza una venta sin productos (esperado HTTP 400)', async function () {
      const response = await authorized('post', '/api/ventas', adminToken).send({
        tipo_doc: 'Boleta',
        metodo_pago: 'Efectivo',
        usuario_id: adminUserId,
        items: [],
      });
      expect(response.status, JSON.stringify(response.body)).to.equal(400);
    });

    it('rechaza una venta con precio unitario negativo (esperado HTTP 400)', async function () {
      const response = await authorized('post', '/api/ventas', adminToken).send({
        tipo_doc: 'Boleta',
        metodo_pago: 'Efectivo',
        usuario_id: adminUserId,
        items: [{ producto_id: 'no-existe', cantidad: 1, precio_unit: -1 }],
      });
      expect(response.status, JSON.stringify(response.body)).to.equal(400);
    });
  });

  describe('Módulo de usuarios', function () {
    it('rechaza crear un usuario sin email (esperado HTTP 400)', async function () {
      const response = await authorized('post', '/api/usuarios', adminToken).send({
        nombre: `Usuario QA ${uniqueSuffix()}`,
        password: 'Temporal123!',
        rol: 'Vendedor',
      });
      expect(response.status, JSON.stringify(response.body)).to.equal(400);
    });

    it('rechaza crear un usuario sin contraseña (esperado HTTP 400)', async function () {
      const response = await authorized('post', '/api/usuarios', adminToken).send({
        nombre: `Usuario QA ${uniqueSuffix()}`,
        email: `sin-clave-${uniqueSuffix()}@example.test`,
        rol: 'Vendedor',
      });
      expect(response.status, JSON.stringify(response.body)).to.equal(400);
    });

    it('rechaza crear un usuario con rol inválido (esperado HTTP 400)', async function () {
      const email = `rol-invalido-${uniqueSuffix()}@example.test`;
      const response = await authorized('post', '/api/usuarios', adminToken).send({
        nombre: 'Usuario con rol inválido',
        email,
        password: 'Temporal123!',
        rol: 'RolNoValido',
      });
      if (response.status === 201) created.users.push(response.body.id);
      expect(response.status, JSON.stringify(response.body)).to.equal(400);
    });

    it('responde HTTP 404 al actualizar un usuario inexistente', async function () {
      const listing = await authorized('get', '/api/usuarios', adminToken);
      expect(listing.status).to.equal(200);
      const highestId = listing.body.reduce(
        (maximum, user) => Math.max(maximum, Number(user.id) || 0),
        0
      );
      const response = await authorized(
        'put',
        `/api/usuarios/${highestId + 1000000}`,
        adminToken
      ).send({
        nombre: 'Usuario inexistente',
        email: `inexistente-${uniqueSuffix()}@example.test`,
        rol: 'Vendedor',
      });
      expect(response.status, JSON.stringify(response.body)).to.equal(404);
    });
  });

  describe('Módulo de clientes', function () {
    it('rechaza crear un cliente sin nombre (esperado HTTP 400)', async function () {
      const response = await authorized('post', '/api/clientes', adminToken).send({
        nombre: ' ',
      });
      expect(response.status, JSON.stringify(response.body)).to.equal(400);
    });

    it('rechaza un DNI duplicado con HTTP 409', async function () {
      const dni = String(Math.floor(10000000 + Math.random() * 90000000));
      const first = await authorized('post', '/api/clientes', adminToken).send({
        nombre: `Cliente QA ${uniqueSuffix()}`,
        dni,
      });
      expect(first.status, JSON.stringify(first.body)).to.equal(201);
      created.clients.push(first.body.id);

      const duplicate = await authorized('post', '/api/clientes', adminToken).send({
        nombre: `Duplicado QA ${uniqueSuffix()}`,
        dni,
      });
      expect(duplicate.status, JSON.stringify(duplicate.body)).to.equal(409);
    });

    it('rechaza un email inválido al crear un cliente (esperado HTTP 400)', async function () {
      const response = await authorized('post', '/api/clientes', adminToken).send({
        nombre: `Cliente con email inválido ${uniqueSuffix()}`,
        email: 'no-es-un-email',
      });
      if (response.status === 201) created.clients.push(response.body.id);
      expect(response.status, JSON.stringify(response.body)).to.equal(400);
    });
  });

  describe('Módulo de categorías', function () {
    it('rechaza crear una categoría sin nombre (esperado HTTP 400)', async function () {
      const response = await authorized('post', '/api/categorias', adminToken).send({
        nombre: ' ',
        descripcion: 'Prueba negativa',
        productos: 0,
      });
      if (response.status === 201) created.categories.push(response.body.id);
      expect(response.status, JSON.stringify(response.body)).to.equal(400);
    });

    it('responde HTTP 404 al actualizar una categoría inexistente', async function () {
      const response = await authorized(
        'put',
        `/api/categorias/NO-${uniqueSuffix()}`,
        adminToken
      ).send({ nombre: 'Categoría inexistente', descripcion: '', productos: 0 });
      expect(response.status, JSON.stringify(response.body)).to.equal(404);
    });
  });

  describe('Módulo de autenticación', function () {
    it('bloquea tras cuatro intentos de login fallidos (esperado HTTP 429)', async function () {
      const email = `intentos-${uniqueSuffix()}@example.test`;
      let lastResponse;
      for (let attempt = 0; attempt < 4; attempt += 1) {
        lastResponse = await login({ email, password: 'Incorrecta123!' });
      }
      expect(lastResponse.status, JSON.stringify(lastResponse.body)).to.equal(429);
    });

    it('rechaza un email con formato inválido (esperado HTTP 400)', async function () {
      const response = await login({
        email: 'esto-no-es-un-email',
        password: 'Temporal123!',
      });
      expect(response.status, JSON.stringify(response.body)).to.equal(400);
    });

    it('rechaza login sin contraseña (esperado HTTP 400)', async function () {
      const response = await login({ email: adminCredentials.email });
      expect(response.status, JSON.stringify(response.body)).to.equal(400);
    });
  });

  describe('Módulo de laboratorios', function () {
    it('rechaza crear un laboratorio sin nombre (esperado HTTP 400)', async function () {
      const response = await authorized('post', '/api/laboratorios', adminToken).send({
        pais: 'QA',
        contacto: 'QA',
        telefono: '000000000',
        productos: 0,
      });
      if (response.status === 201) created.laboratories.push(response.body.id);
      expect(response.status, JSON.stringify(response.body)).to.equal(400);
    });
  });

  describe('Módulo de compras', function () {
    it('rechaza una compra con total negativo (esperado HTTP 400)', async function () {
      const id = `NA${uniqueSuffix()}`;
      const response = await authorized('post', '/api/compras', adminToken).send({
        id,
        proveedor: 'Proveedor QA',
        fecha: new Date().toISOString().slice(0, 10),
        total: -1,
        estado: 'pendiente',
        productos: [],
        notas: 'Prueba negativa',
      });
      if (response.status === 201) created.purchases.push(id);
      expect(response.status, JSON.stringify(response.body)).to.equal(400);
    });
  });
});
