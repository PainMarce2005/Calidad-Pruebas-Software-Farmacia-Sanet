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

const credentials = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@farmacia.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'Admin123!',
  },
  seller: {
    email: process.env.TEST_SELLER_EMAIL || 'vendedor@farmacia.com',
    password: process.env.TEST_SELLER_PASSWORD || 'Vende123!',
  },
};

const jwtSecret = process.env.JWT_SECRET || 'farmacia_sanet_secret_key_change_in_prod';
const uniqueSuffix = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const authorized = (method, path, token) =>
  request(app)[method](path).set('Authorization', `Bearer ${token}`);

async function login(userCredentials) {
  return request(app).post('/api/auth/login').send(userCredentials);
}

describe('Pruebas negativas de la API', function () {
  this.timeout(30000);

  let adminToken;
  let adminUserId;
  let sellerToken;

  before(async function () {
    const adminResponse = await login(credentials.admin);
    expect(adminResponse.status, JSON.stringify(adminResponse.body)).to.equal(200);
    adminToken = adminResponse.body.token;
    adminUserId = jwt.verify(adminToken, jwtSecret).id;

    const sellerResponse = await login(credentials.seller);
    expect(sellerResponse.status, JSON.stringify(sellerResponse.body)).to.equal(200);
    sellerToken = sellerResponse.body.token;
  });

  after(async function () {
    const pool = require('../../backend/db');
    const databaseSingleton = require('../../backend/patterns/DatabaseSingleton');
    await Promise.all([pool.end(), databaseSingleton.close()]);
  });

  describe('Autenticación y autorización', function () {
    it('rechaza una solicitud sin token con HTTP 401', async function () {
      const response = await request(app).get('/api/productos');
      expect(response.status).to.equal(401);
    });

    it('rechaza un token malformado con HTTP 401', async function () {
      const response = await request(app)
        .get('/api/productos')
        .set('Authorization', 'Bearer esto-no-es-un-jwt');
      expect(response.status).to.equal(401);
    });

    it('rechaza un token expirado con HTTP 401', async function () {
      const expiredToken = jwt.sign(
        { id: adminUserId, rol: 'Administrador' },
        jwtSecret,
        { expiresIn: -1 }
      );
      const response = await request(app)
        .get('/api/productos')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(response.status).to.equal(401);
    });

    it('deniega al Vendedor acceso al historial exclusivo de Admin con HTTP 403', async function () {
      const response = await authorized('get', '/api/auth/historial', sellerToken);
      expect(response.status).to.equal(403);
    });

    it('deniega al Vendedor el listado de usuarios con HTTP 403', async function () {
      const response = await authorized('get', '/api/usuarios', sellerToken);
      expect(response.status).to.equal(403);
    });
  });

  describe('Validación de solicitudes', function () {
    it('rechaza la creación de un producto con el nombre vacío con HTTP 400', async function () {
      const response = await authorized('post', '/api/productos', adminToken).send({
        id: `NEG${uniqueSuffix()}`,
        nombre: '',
        descripcion: 'Registro negativo',
        laboratorio: 'QA',
        lote: 'QA',
        stock: 1,
        stock_minimo: 1,
        precio: 1,
        vencimiento: '2030-12-31',
        estado: 'activo',
        categoria: '',
      });
      expect(response.status).to.equal(400);
    });

    it('rechaza la creación de un producto con stock negativo con HTTP 400', async function () {
      const id = `NEG${uniqueSuffix()}`;
      let created = false;

      try {
        const response = await authorized('post', '/api/productos', adminToken).send({
          id,
          nombre: `Producto negativo ${id}`,
          descripcion: 'Prueba negativa',
          laboratorio: 'QA',
          lote: 'QA',
          stock: -1,
          stock_minimo: 0,
          precio: 1,
          vencimiento: '2030-12-31',
          estado: 'activo',
          categoria: '',
        });
        created = response.status === 201;
        expect(response.status, JSON.stringify(response.body)).to.equal(400);
      } finally {
        if (created) {
          const deletion = await authorized('delete', `/api/productos/${id}`, adminToken);
          expect(deletion.status).to.equal(200);
        }
      }
    });

    it('rechaza una venta sin productos con HTTP 400', async function () {
      const response = await authorized('post', '/api/ventas', adminToken).send({
        tipo_doc: 'Boleta',
        metodo_pago: 'Efectivo',
        usuario_id: adminUserId,
        items: [],
      });
      expect(response.status).to.equal(400);
    });

    it('rechaza un tipo de documento inválido con HTTP 400', async function () {
      const response = await authorized('post', '/api/ventas', adminToken).send({
        tipo_doc: 'Documento inválido',
        metodo_pago: 'Efectivo',
        usuario_id: adminUserId,
        items: [{ producto_id: 'inexistente', cantidad: 1, precio_unit: 1 }],
      });
      expect(response.status).to.equal(400);
    });

    it('rechaza crear una categoría sin nombre con HTTP 400', async function () {
      const response = await authorized('post', '/api/categorias', adminToken).send({
        nombre: ' ',
        descripcion: 'Prueba negativa',
        productos: 0,
      });
      expect(response.status).to.equal(400);
    });

    it('rechaza cantidad de venta con tipo de dato no numérico con HTTP 400', async function () {
      const response = await authorized('post', '/api/ventas', adminToken).send({
        tipo_doc: 'Boleta',
        metodo_pago: 'Efectivo',
        usuario_id: adminUserId,
        items: [{ producto_id: 'inexistente', cantidad: 'muchas', precio_unit: 1 }],
      });
      expect(response.status).to.equal(400);
    });

    it('rechaza una cadena numérica excesivamente larga como cantidad con HTTP 400', async function () {
      const response = await authorized('post', '/api/ventas', adminToken).send({
        tipo_doc: 'Boleta',
        metodo_pago: 'Efectivo',
        usuario_id: adminUserId,
        items: [{ producto_id: 'inexistente', cantidad: '9'.repeat(10000), precio_unit: 1 }],
      });
      expect(response.status).to.equal(400);
    });
  });

  describe('Recursos y consistencia de datos', function () {
    it('responde HTTP 404 al consultar un producto inexistente', async function () {
      const response = await authorized(
        'get',
        `/api/productos/NEG-${uniqueSuffix()}`,
        adminToken
      );
      expect(response.status).to.equal(404);
    });

    it('responde HTTP 404 al consultar un usuario inexistente', async function () {
      const listResponse = await authorized('get', '/api/usuarios', adminToken);
      expect(listResponse.status).to.equal(200);
      const highestId = listResponse.body.reduce(
        (maximum, user) => Math.max(maximum, Number(user.id) || 0),
        0
      );

      const response = await authorized(
        'get',
        `/api/usuarios/${highestId + 1000000}`,
        adminToken
      );
      expect(response.status).to.equal(404);
    });

    it('responde HTTP 404 al actualizar un producto inexistente', async function () {
      const id = `NEG-${uniqueSuffix()}`;
      const response = await authorized('put', `/api/productos/${id}`, adminToken).send({
        nombre: 'Producto inexistente',
        descripcion: 'Prueba negativa',
        laboratorio: 'QA',
        lote: 'QA',
        stock: 1,
        stock_minimo: 1,
        precio: 1,
        vencimiento: '2030-12-31',
        estado: 'activo',
        categoria: '',
      });
      expect(response.status).to.equal(404);
    });

    it('responde HTTP 404 al actualizar un usuario inexistente', async function () {
      const users = await authorized('get', '/api/usuarios', adminToken);
      expect(users.status).to.equal(200);
      const highestId = users.body.reduce(
        (maximum, user) => Math.max(maximum, Number(user.id) || 0),
        0
      );

      const response = await authorized(
        'put',
        `/api/usuarios/${highestId + 1000000}`,
        adminToken
      ).send({
        nombre: 'Usuario inexistente',
        email: `missing-${uniqueSuffix()}@example.test`,
        rol: 'Vendedor',
      });
      expect(response.status).to.equal(404);
    });

    it('responde HTTP 404 al actualizar una categoría inexistente', async function () {
      const response = await authorized(
        'put',
        `/api/categorias/${uniqueSuffix()}`,
        adminToken
      ).send({
        nombre: 'Categoría inexistente',
        descripcion: 'Prueba negativa',
        productos: 0,
      });
      expect(response.status).to.equal(404);
    });

    it('rechaza una venta superior al stock disponible sin modificar inventario ni registrar venta', async function () {
      const productsResponse = await authorized('get', '/api/productos', adminToken);
      expect(productsResponse.status).to.equal(200);
      const product = productsResponse.body.find(
        (item) => Number(item.stock) > 0 && item.estado !== 'vencido'
      );
      expect(product, 'La prueba requiere un producto vendible con stock positivo').to.exist;

      const database = require('../../backend/patterns/DatabaseSingleton');
      const [[salesBefore]] = await database.query('SELECT COUNT(*) AS total FROM ventas');
      const stockBefore = Number(product.stock);
      const quantity = stockBefore + 1;

      const response = await authorized('post', '/api/ventas', adminToken).send({
        tipo_doc: 'Boleta',
        metodo_pago: 'Efectivo',
        usuario_id: adminUserId,
        items: [{
          producto_id: product.id,
          producto_nombre: product.nombre,
          cantidad: quantity,
          precio_unit: Number(product.precio),
        }],
      });

      expect(response.status).to.equal(400);
      expect(response.body.error).to.include('Stock insuficiente');

      const productAfter = await authorized(
        'get',
        `/api/productos/${encodeURIComponent(product.id)}`,
        adminToken
      );
      expect(Number(productAfter.body.stock)).to.equal(stockBefore);

      const [[salesAfter]] = await database.query('SELECT COUNT(*) AS total FROM ventas');
      expect(Number(salesAfter.total)).to.equal(Number(salesBefore.total));
    });

    it('trata una carga tipo SQL inyectada como un ID literal inexistente con HTTP 404', async function () {
      const attemptedId = encodeURIComponent("' OR '1'='1");
      const response = await authorized(
        'get',
        `/api/productos/${attemptedId}`,
        adminToken
      );
      expect(response.status).to.equal(404);
    });
  });
});
