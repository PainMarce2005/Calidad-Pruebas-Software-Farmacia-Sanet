const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });
require('dotenv').config({
  path: path.join(__dirname, '..', '..', 'backend', '.env'),
  quiet: true,
});

const { expect } = require('chai');
const fs = require('fs/promises');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../backend/index');
const { alertasObserver } = require('../../backend/patterns/StockObserver');

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

const uniqueSuffix = () =>
  `${Date.now().toString(36).slice(-7)}${Math.random().toString(36).slice(2, 4)}`;

const api = (method, path, token) =>
  request(app)[method](path).set('Authorization', `Bearer ${token}`);

async function login(userCredentials) {
  return request(app)
    .post('/api/auth/login')
    .send(userCredentials);
}

describe('API REST - pruebas de integración', function () {
  this.timeout(30000);

  let adminToken;
  let adminUserId;
  let sellerToken;

  before(async function () {
    const adminResponse = await login(credentials.admin);
    expect(adminResponse.status, JSON.stringify(adminResponse.body)).to.equal(200);
    adminToken = adminResponse.body.token;
    adminUserId = jwt.verify(
      adminToken,
      process.env.JWT_SECRET || 'farmacia_sanet_secret_key_change_in_prod'
    ).id;

    const sellerResponse = await login(credentials.seller);
    expect(sellerResponse.status, JSON.stringify(sellerResponse.body)).to.equal(200);
    sellerToken = sellerResponse.body.token;
  });

  after(async function () {
    const pool = require('../../backend/db');
    const databaseSingleton = require('../../backend/patterns/DatabaseSingleton');
    await Promise.all([pool.end(), databaseSingleton.close()]);
  });

  afterEach(function () {
    alertasObserver.limpiarAlertas();
  });

  describe('Autenticación y seguridad', function () {
    it('POST /api/auth/login devuelve un JWT válido para credenciales correctas', async function () {
      const response = await login(credentials.admin);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('token').that.is.a('string').and.not.empty;
      expect(response.body.usuario).to.include({
        email: credentials.admin.email.toLowerCase(),
        rol: 'Administrador',
      });

      const decoded = jwt.verify(
        response.body.token,
        process.env.JWT_SECRET || 'farmacia_sanet_secret_key_change_in_prod'
      );
      expect(decoded).to.include({
        email: credentials.admin.email.toLowerCase(),
        rol: 'Administrador',
      });

      const history = await api(
        'get',
        `/api/auth/historial?resultado=Exitoso&email=${encodeURIComponent(credentials.admin.email)}`,
        adminToken
      );
      expect(history.status).to.equal(200);
      expect(
        history.body.registros.some((entry) =>
          entry.email.toLowerCase() === credentials.admin.email.toLowerCase() &&
          entry.resultado === 'Exitoso'
        )
      ).to.equal(true);
    });

    it('POST /api/auth/login rechaza credenciales incorrectas y registra el intento fallido', async function () {
      const email = `invalid-${uniqueSuffix()}@example.test`;
      const response = await login({ email, password: 'WrongPassword123!' });

      expect(response.status).to.equal(401);
      expect(response.body.error).to.equal('Credenciales inválidas.');

      const history = await api(
        'get',
        `/api/auth/historial?resultado=Fallido&email=${encodeURIComponent(email)}`,
        adminToken
      );
      expect(history.status).to.equal(200);
      expect(history.body.registros).to.have.lengthOf(1);
      expect(history.body.registros[0]).to.include({ email, resultado: 'Fallido' });
    });

    it('GET /api/auth/historial exige autenticación y rol de administrador', async function () {
      const anonymous = await request(app).get('/api/auth/historial');
      expect(anonymous.status).to.equal(401);

      const sellerResponse = await api('get', '/api/auth/historial', sellerToken);
      expect(sellerResponse.status).to.equal(403);

      const adminResponse = await api('get', '/api/auth/historial', adminToken);
      expect(adminResponse.status).to.equal(200);
      expect(adminResponse.body.registros).to.be.an('array');
    });

    it('POST /api/auth/logout confirma el cierre de sesión', async function () {
      const response = await request(app).post('/api/auth/logout');
      expect(response.status).to.equal(200);
      expect(response.body.mensaje).to.equal('Sesión cerrada correctamente.');
    });
  });

  describe('Productos y alertas de stock', function () {
    it('GET /api/productos requiere token y devuelve una lista; GET /:id devuelve el producto', async function () {
      const anonymous = await request(app).get('/api/productos');
      expect(anonymous.status).to.equal(401);

      const response = await api('get', '/api/productos', adminToken);
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body).not.to.be.empty;

      const product = response.body.find((item) => Number(item.stock) > 0);
      expect(product, 'Se necesita un producto con existencias para las pruebas').to.exist;

      const detail = await api(
        'get',
        `/api/productos/${encodeURIComponent(product.id)}`,
        adminToken
      );
      expect(detail.status).to.equal(200);
      expect(String(detail.body.id)).to.equal(String(product.id));
    });

    it('POST /api/productos crea un producto, genera una alerta de stock bajo y permite eliminarlo', async function () {
      const id = `T${uniqueSuffix()}`;
      let created = false;

      try {
        const response = await api('post', '/api/productos', adminToken).send({
          id,
          nombre: `Producto API ${id}`,
          descripcion: 'Fixture de integración',
          laboratorio: 'Laboratorio de prueba',
          lote: id,
          stock: 1,
          stock_minimo: 5,
          precio: 2.5,
          vencimiento: '2028-12-31',
          estado: 'activo',
          categoria: '',
        });
        expect(response.status, JSON.stringify(response.body)).to.equal(201);
        created = true;

        const alerts = await api('get', '/api/productos/alertas', adminToken);
        expect(alerts.status).to.equal(200);
        const alert = alerts.body.find((item) => String(item.productoId) === id);
        expect(alert, `Debe existir una alerta para el producto ${id}`).to.exist;
        expect(alert).to.include({
          tipo: 'STOCK_BAJO',
          nombre: `Producto API ${id}`,
        });
        expect(Number(alert.stock)).to.equal(1);
        expect(Number(alert.minimo)).to.equal(5);

        const detail = await api('get', `/api/productos/${id}`, adminToken);
        expect(detail.status).to.equal(200);
        expect(detail.body.nombre).to.equal(`Producto API ${id}`);

        const update = await api('put', `/api/productos/${id}`, adminToken).send({
          nombre: `Producto actualizado ${id}`,
          descripcion: 'Fixture actualizado',
          laboratorio: 'Laboratorio de prueba',
          lote: id,
          stock: 10,
          stock_minimo: 5,
          precio: 3.5,
          vencimiento: '2028-12-31',
          estado: 'activo',
          categoria: '',
        });
        expect(update.status).to.equal(200);
        const updated = await api('get', `/api/productos/${id}`, adminToken);
        expect(updated.body.nombre).to.equal(`Producto actualizado ${id}`);
        expect(Number(updated.body.stock)).to.equal(10);
      } finally {
        if (created) {
          const deletion = await api('delete', `/api/productos/${id}`, adminToken);
          expect(deletion.status).to.equal(200);
        }
      }
    });
  });

  describe('Clientes', function () {
    it('realiza CRUD de cliente y valida el listado protegido', async function () {
      const suffix = uniqueSuffix();
      const dni = String(10000000 + Math.floor(Math.random() * 89999999));
      let clientId;

      try {
        const creation = await api('post', '/api/clientes', adminToken).send({
          nombre: `Cliente API ${suffix}`,
          dni,
          direccion: 'Dirección temporal',
          telefono: '999000111',
          estado: 'Activo',
        });
        expect(creation.status, JSON.stringify(creation.body)).to.equal(201);
        clientId = creation.body.id;

        const detail = await api('get', `/api/clientes/${clientId}`, adminToken);
        expect(detail.status).to.equal(200);
        expect(detail.body).to.include({ nombre: `Cliente API ${suffix}`, dni });

        const listing = await api('get', '/api/clientes', sellerToken);
        expect(listing.status).to.equal(200);
        expect(listing.body).to.be.an('array');
        expect(listing.body.some((client) => Number(client.id) === Number(clientId))).to.equal(true);

        const update = await api('put', `/api/clientes/${clientId}`, adminToken).send({
          nombre: `Cliente actualizado ${suffix}`,
          dni,
          direccion: 'Dirección actualizada',
          telefono: '999000222',
          estado: 'Activo',
        });
        expect(update.status).to.equal(200);

        const updated = await api('get', `/api/clientes/${clientId}`, adminToken);
        expect(updated.body).to.include({
          nombre: `Cliente actualizado ${suffix}`,
          direccion: 'Dirección actualizada',
          telefono: '999000222',
        });
      } finally {
        if (clientId) {
          const deletion = await api('delete', `/api/clientes/${clientId}`, adminToken);
          expect(deletion.status).to.equal(200);
        }
      }
    });

    it('POST /api/clientes valida que el nombre sea obligatorio', async function () {
      const response = await api('post', '/api/clientes', adminToken).send({ nombre: ' ' });
      expect(response.status).to.equal(400);
      expect(response.body.error).to.equal('El nombre es obligatorio.');
    });
  });

  describe('Ventas y stock', function () {
    async function getSellableProduct() {
      const products = await api('get', '/api/productos', adminToken);
      expect(products.status).to.equal(200);
      const product = products.body.find((item) =>
        Number(item.stock) > 0 && item.estado !== 'vencido'
      );
      expect(product, 'Se necesita un producto no vencido con stock disponible').to.exist;
      return product;
    }

    it('POST /api/ventas rechaza una cantidad superior al stock y no modifica existencias', async function () {
      const product = await getSellableProduct();
      const stockBefore = Number(product.stock);
      const quantity = stockBefore + 1;
      const subtotal = Number(product.precio) * quantity;

      const response = await api('post', '/api/ventas', adminToken).send({
        tipo_doc: 'Boleta',
        metodo_pago: 'Efectivo',
        subtotal,
        igv: subtotal * 0.18,
        total: subtotal * 1.18,
        usuario_id: adminUserId,
        items: [{
          producto_id: product.id,
          producto_nombre: product.nombre,
          cantidad: quantity,
          precio_unit: Number(product.precio),
          subtotal,
        }],
      });

      expect(response.status).to.equal(400);
      expect(response.body.error).to.include('Stock insuficiente');
      const unchanged = await api(
        'get',
        `/api/productos/${encodeURIComponent(product.id)}`,
        adminToken
      );
      expect(Number(unchanged.body.stock)).to.equal(stockBefore);
    });

    it('registra una venta, confirma el detalle y descuenta/restaura stock al anular', async function () {
      const product = await getSellableProduct();
      const stockBefore = Number(product.stock);
      const price = Number(product.precio);
      const subtotal = Number(price.toFixed(2));
      const igv = Number((subtotal * 0.18).toFixed(2));
      const total = Number((subtotal + igv).toFixed(2));
      let saleId;

      try {
        const creation = await api('post', '/api/ventas', adminToken).send({
          tipo_doc: 'Boleta',
          metodo_pago: 'Efectivo',
          subtotal,
          igv,
          total,
          usuario_id: adminUserId,
          items: [{
            producto_id: product.id,
            producto_nombre: product.nombre,
            cantidad: 1,
            precio_unit: price,
            subtotal,
          }],
        });
        expect(creation.status, JSON.stringify(creation.body)).to.equal(201);
        saleId = creation.body.id;

        const detail = await api('get', `/api/ventas/${saleId}`, adminToken);
        expect(detail.status).to.equal(200);
        expect(Number(detail.body.total)).to.equal(total);
        expect(detail.body.items).to.have.lengthOf(1);
        expect(String(detail.body.items[0].producto_id)).to.equal(String(product.id));

        const listing = await api('get', '/api/ventas', adminToken);
        expect(listing.status).to.equal(200);
        expect(listing.body.some((sale) => Number(sale.id) === Number(saleId))).to.equal(true);

        const receipt = await api('get', `/api/ventas/${saleId}/pdf`, adminToken);
        expect(receipt.status).to.equal(200);
        expect(receipt.headers['content-type']).to.include('application/pdf');

        const sellerListing = await api('get', '/api/ventas', sellerToken);
        expect(sellerListing.status).to.equal(403);

        const stockAfterSale = await api(
          'get',
          `/api/productos/${encodeURIComponent(product.id)}`,
          adminToken
        );
        expect(Number(stockAfterSale.body.stock)).to.equal(stockBefore - 1);
      } finally {
        if (saleId) {
          const cancellation = await api(
            'put',
            `/api/ventas/${saleId}/anular`,
            adminToken
          ).send({});
          expect(cancellation.status).to.equal(200);

          const restored = await api(
            'get',
            `/api/productos/${encodeURIComponent(product.id)}`,
            adminToken
          );
          expect(Number(restored.body.stock)).to.equal(stockBefore);

          const database = require('../../backend/patterns/DatabaseSingleton');
          await database.query('DELETE FROM venta_items WHERE venta_id = ?', [saleId]);
          await database.query('DELETE FROM ventas WHERE id = ?', [saleId]);

          const receiptPath = path.join(
            __dirname,
            '..',
            '..',
            'backend',
            'comprobantes',
            'boletas',
            `B001-${String(saleId).padStart(8, '0')}.pdf`
          );
          await fs.rm(receiptPath, { force: true });
        }
      }
    });
  });

  describe('Órdenes de compra', function () {
    it('realiza CRUD de una orden y la elimina al finalizar', async function () {
      const id = `C${uniqueSuffix()}`;
      const purchaseBody = {
        proveedor: `Proveedor API ${id}`,
        fecha: new Date().toISOString().slice(0, 10),
        total: 125.5,
        estado: 'pendiente',
        productos: [{ producto: 'Producto de prueba', cantidad: 1 }],
        notas: 'Orden temporal de integración',
      };
      let created = false;

      try {
        const creation = await api('post', '/api/compras', adminToken)
          .send({ id, ...purchaseBody });
        expect(creation.status, JSON.stringify(creation.body)).to.equal(201);
        created = true;

        const detail = await api('get', `/api/compras/${id}`, adminToken);
        expect(detail.status).to.equal(200);
        expect(detail.body).to.include({ id, proveedor: purchaseBody.proveedor });
        expect(Number(detail.body.total)).to.equal(purchaseBody.total);

        const listing = await api('get', '/api/compras', adminToken);
        expect(listing.status).to.equal(200);
        expect(listing.body.some((purchase) => purchase.id === id)).to.equal(true);

        const updated = await api('put', `/api/compras/${id}`, adminToken).send({
          ...purchaseBody,
          proveedor: `Proveedor actualizado ${id}`,
          total: 200,
        });
        expect(updated.status).to.equal(200);

        const updatedDetail = await api('get', `/api/compras/${id}`, adminToken);
        expect(updatedDetail.body.proveedor).to.equal(`Proveedor actualizado ${id}`);
        expect(Number(updatedDetail.body.total)).to.equal(200);
      } finally {
        if (created) {
          const deletion = await api('delete', `/api/compras/${id}`, adminToken);
          expect(deletion.status).to.equal(200);
        }
      }
    });
  });

  describe('Usuarios y permisos', function () {
    it('GET /api/usuarios permite listar al administrador, exige token y deniega al vendedor', async function () {
      const anonymous = await request(app).get('/api/usuarios');
      expect(anonymous.status).to.equal(401);

      const sellerListing = await api('get', '/api/usuarios', sellerToken);
      expect(sellerListing.status).to.equal(403);

      const adminListing = await api('get', '/api/usuarios', adminToken);
      expect(adminListing.status).to.equal(200);
      expect(adminListing.body).to.be.an('array');
    });

    it('crea, consulta, actualiza y elimina un usuario temporal con rol', async function () {
      const suffix = uniqueSuffix();
      const email = `api-${suffix}@example.test`;
      let userId;

      try {
        const creation = await api('post', '/api/usuarios', adminToken).send({
          nombre: `Usuario API ${suffix}`,
          email,
          password: `Tmp${suffix}Aa!`,
          rol: 'Vendedor',
          estado: 'Activo',
        });
        expect(creation.status, JSON.stringify(creation.body)).to.equal(201);
        userId = creation.body.id;

        const availability = await api(
          'get',
          `/api/usuarios/check-email?email=${encodeURIComponent(email)}`,
          adminToken
        );
        expect(availability.status).to.equal(200);
        expect(availability.body.disponible).to.equal(false);

        const detail = await api('get', `/api/usuarios/${userId}`, adminToken);
        expect(detail.status).to.equal(200);
        expect(detail.body).to.include({ email, rol: 'Vendedor' });
        expect(detail.body).not.to.have.property('password_hash');

        const update = await api('put', `/api/usuarios/${userId}`, adminToken).send({
          nombre: `Usuario actualizado ${suffix}`,
          email,
          rol: 'Supervisor',
          estado: 'Activo',
        });
        expect(update.status).to.equal(200);

        const updated = await api('get', `/api/usuarios/${userId}`, adminToken);
        expect(updated.body).to.include({
          nombre: `Usuario actualizado ${suffix}`,
          rol: 'Supervisor',
        });
      } finally {
        if (userId) {
          const deletion = await api('delete', `/api/usuarios/${userId}`, adminToken);
          expect(deletion.status).to.equal(200);
        }
      }
    });

    it('PUT /api/usuarios/:id/password permite al administrador cambiar la clave de otro usuario', async function () {
      const suffix = uniqueSuffix();
      const email = `password-${suffix}@example.test`;
      let userId;

      try {
        const creation = await api('post', '/api/usuarios', adminToken).send({
          nombre: `Usuario contraseña ${suffix}`,
          email,
          password: `Initial${suffix}!`,
          rol: 'Vendedor',
          estado: 'Activo',
        });
        expect(creation.status, JSON.stringify(creation.body)).to.equal(201);
        userId = creation.body.id;

        const passwordUpdate = await api(
          'put',
          `/api/usuarios/${userId}/password`,
          adminToken
        ).send({ password: `Updated${suffix}!` });
        expect(passwordUpdate.status).to.equal(200);

        const authenticated = await login({
          email,
          password: `Updated${suffix}!`,
        });
        expect(authenticated.status).to.equal(200);
        expect(authenticated.body.usuario.email).to.equal(email);
      } finally {
        if (userId) {
          const deletion = await api('delete', `/api/usuarios/${userId}`, adminToken);
          expect(deletion.status).to.equal(200);
        }
      }
    });
  });

  describe('Laboratorios y categorías', function () {
    it('realiza CRUD de laboratorio', async function () {
      const suffix = uniqueSuffix();
      let laboratoryId;

      try {
        const listing = await api('get', '/api/laboratorios', adminToken);
        expect(listing.status).to.equal(200);
        expect(listing.body).to.be.an('array');

        const creation = await api('post', '/api/laboratorios', adminToken).send({
          nombre: `Lab API ${suffix}`,
          pais: 'Perú',
          contacto: 'QA',
          telefono: '999111222',
          productos: 0,
        });
        expect(creation.status, JSON.stringify(creation.body)).to.equal(201);
        laboratoryId = creation.body.id;

        const update = await api('put', `/api/laboratorios/${laboratoryId}`, adminToken).send({
          nombre: `Lab API actualizado ${suffix}`,
          pais: 'Chile',
          contacto: 'QA actualizado',
          telefono: '999222333',
          productos: 1,
        });
        expect(update.status).to.equal(200);
      } finally {
        if (laboratoryId) {
          const deletion = await api(
            'delete',
            `/api/laboratorios/${laboratoryId}`,
            adminToken
          );
          expect(deletion.status).to.equal(200);
        }
      }
    });

    it('realiza CRUD de categoría', async function () {
      const suffix = uniqueSuffix();
      let categoryId;

      try {
        const listing = await api('get', '/api/categorias', adminToken);
        expect(listing.status).to.equal(200);
        expect(listing.body).to.be.an('array');

        const creation = await api('post', '/api/categorias', adminToken).send({
          nombre: `Categoría API ${suffix}`,
          descripcion: 'Fixture de integración',
          productos: 0,
        });
        expect(creation.status, JSON.stringify(creation.body)).to.equal(201);
        categoryId = creation.body.id;

        const update = await api('put', `/api/categorias/${categoryId}`, adminToken).send({
          nombre: `Categoría actualizada ${suffix}`,
          descripcion: 'Descripción actualizada',
          productos: 1,
        });
        expect(update.status).to.equal(200);
      } finally {
        if (categoryId) {
          const deletion = await api('delete', `/api/categorias/${categoryId}`, adminToken);
          expect(deletion.status).to.equal(200);
        }
      }
    });
  });
});
