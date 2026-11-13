const { expect } = require('chai');
const {
  ProductoBuilder,
  CompraBuilder,
} = require('../backend/patterns/builders');
const {
  TAX_RATE,
  calculateSaleTotals,
} = require('../backend/services/VentaCalculator');
const {
  ConsoleLogger,
  AlertasObserver,
  EmailObserver,
  Observer,
  StockSubject,
} = require('../backend/patterns/StockObserver');

describe('Pruebas unitarias aisladas del backend', function () {
  describe('Cálculo de importes de venta', function () {
    it('calcula subtotal, IGV del 18% y total con redondeo monetario', function () {
      const result = calculateSaleTotals([
        { producto_id: 'P1', cantidad: 2, precio_unit: 10.25 },
        { producto_id: 'P2', cantidad: 1, precio_unit: 4.5 },
      ]);

      expect(TAX_RATE).to.equal(0.18);
      expect(result).to.deep.equal({
        items: [
          { producto_id: 'P1', cantidad: 2, precio_unit: 10.25, subtotal: 20.5 },
          { producto_id: 'P2', cantidad: 1, precio_unit: 4.5, subtotal: 4.5 },
        ],
        subtotal: 25,
        igv: 4.5,
        total: 29.5,
      });
    });

    it('rechaza ventas vacías y cantidades o precios inválidos', function () {
      expect(() => calculateSaleTotals([]))
        .to.throw('La venta debe tener al menos un producto.');
      expect(() => calculateSaleTotals([{ cantidad: 0, precio_unit: 10 }]))
        .to.throw('La cantidad de cada producto debe ser mayor a 0.');
      expect(() => calculateSaleTotals([{ cantidad: 1, precio_unit: -1 }]))
        .to.throw('El precio unitario de cada producto debe ser un número válido.');
    });
  });

  describe('ProductoBuilder', function () {
    it('construye un producto con propiedades por defecto y encadenamiento', function () {
      const builder = new ProductoBuilder();
      const product = builder
        .setId('UNIT-001')
        .setNombre('Producto unitario')
        .setDescripcion('Descripción de prueba')
        .setLaboratorio('Laboratorio unitario')
        .setLote('LOTE-001')
        .setPrecio(12.5)
        .setStock(3, 2)
        .setVencimiento('2027-01-01')
        .setEstado('activo')
        .setCategoria('Categoría unitaria')
        .build();

      expect(product).to.include({
        id: 'UNIT-001',
        nombre: 'Producto unitario',
        descripcion: 'Descripción de prueba',
        laboratorio: 'Laboratorio unitario',
        lote: 'LOTE-001',
        precio: 12.5,
        stock: 3,
        stock_minimo: 2,
        vencimiento: '2027-01-01',
        estado: 'activo',
        categoria: 'Categoría unitaria',
      });
    });

    it('rechaza producto sin identificador, nombre, precio positivo o estado válido', function () {
      expect(() => new ProductoBuilder().setNombre('Sin código').setPrecio(2).build())
        .to.throw('El campo "id" es obligatorio.');
      expect(() => new ProductoBuilder().setId('UNIT-002').setPrecio(2).build())
        .to.throw('El campo "nombre" es obligatorio.');
      expect(() => new ProductoBuilder().setId('UNIT-003').setNombre('Sin precio').build())
        .to.throw('El "precio" debe ser mayor a 0.');
      expect(() => new ProductoBuilder().setEstado('desconocido'))
        .to.throw('Estado inválido');
    });
  });

  describe('CompraBuilder', function () {
    it('serializa productos y conserva los valores de la orden', function () {
      const products = [{ producto: 'Medicamento', cantidad: 3 }];
      const purchase = new CompraBuilder()
        .setId('UNIT-C001')
        .setProveedor('Proveedor unitario')
        .setFecha('2026-01-15')
        .setTotal(50)
        .setEstado('aprobada')
        .setProductos(products)
        .setNotas('Entrega completa')
        .build();

      expect(purchase).to.include({
        id: 'UNIT-C001',
        proveedor: 'Proveedor unitario',
        fecha: '2026-01-15',
        total: 50,
        estado: 'aprobada',
        notas: 'Entrega completa',
      });
      expect(JSON.parse(purchase.productos)).to.deep.equal(products);
    });

    it('rechaza proveedor ausente, total no positivo y productos no válidos', function () {
      expect(() => new CompraBuilder().setTotal(10).build())
        .to.throw('El campo "proveedor" es obligatorio.');
      expect(() => new CompraBuilder().setProveedor('Proveedor').setTotal(0).build())
        .to.throw('El "total" debe ser mayor a 0.');
      expect(() => new CompraBuilder().setEstado('invalido'))
        .to.throw('Estado inválido');
      expect(() =>
        new CompraBuilder()
          .setProveedor('Proveedor')
          .setTotal(10)
          .setProductos('{invalido')
          .build()
      ).to.throw('El campo "productos" debe ser un JSON válido.');
    });
  });

  describe('Observer de stock', function () {
    it('hace cumplir el contrato abstracto de Observer', function () {
      expect(() => new Observer().actualizar({}))
        .to.throw('El método actualizar() debe ser implementado por la subclase.');
    });

    it('registra la alerta de stock bajo mediante ConsoleLogger', function () {
      const previousWarn = console.warn;
      let loggedMessage;
      console.warn = (message) => {
        loggedMessage = message;
      };

      try {
        new ConsoleLogger().actualizar({
          id: 'UNIT-LOG',
          nombre: 'Producto registrado',
          stock: 1,
          stock_minimo: 4,
        });
      } finally {
        console.warn = previousWarn;
      }

      expect(loggedMessage).to.include('Producto registrado');
      expect(loggedMessage).to.include('Stock actual: 1');
    });

    it('simula el aviso de email para el destinatario configurado', function () {
      const previousInfo = console.info;
      const messages = [];
      console.info = (message) => {
        messages.push(message);
      };

      try {
        new EmailObserver('qa@example.test').actualizar({
          nombre: 'Producto por reponer',
          stock: 1,
          stock_minimo: 4,
        });
        new EmailObserver().actualizar({
          nombre: 'Producto con destinatario por defecto',
          stock: 0,
          stock_minimo: 3,
        });
      } finally {
        console.info = previousInfo;
      }

      expect(messages).to.have.lengthOf(2);
      expect(messages[0]).to.include('qa@example.test');
      expect(messages[1]).to.include('admin@farmacia.com');
    });

    it('notifica observadores cuando el stock está por debajo del mínimo', function () {
      class TestObserver extends Observer {
        constructor() {
          super();
          this.received = [];
        }

        actualizar(product) {
          this.received.push(product);
        }
      }

      const subject = new StockSubject();
      const observer = new TestObserver();
      subject.suscribir(observer);
      const lowStockProduct = {
        id: 'UNIT-STOCK',
        nombre: 'Producto con stock bajo',
        stock: 2,
        stock_minimo: 5,
      };

      subject.actualizarStock(lowStockProduct);
      expect(observer.received).to.deep.equal([lowStockProduct]);

      subject.actualizarStock({ ...lowStockProduct, stock: 5 });
      expect(observer.received).to.have.lengthOf(1);
      subject.desuscribir(observer);
      subject.actualizarStock(lowStockProduct);
      expect(observer.received).to.have.lengthOf(1);
    });

    it('registra la alerta con datos del producto y permite limpiarla', function () {
      const observer = new AlertasObserver();
      observer.actualizar({
        id: 'UNIT-ALERT',
        nombre: 'Producto de alerta',
        stock: 1,
        stock_minimo: 4,
      });

      expect(observer.obtenerAlertas()).to.have.lengthOf(1);
      expect(observer.obtenerAlertas()[0]).to.include({
        tipo: 'STOCK_BAJO',
        productoId: 'UNIT-ALERT',
        nombre: 'Producto de alerta',
        stock: 1,
        minimo: 4,
      });
      observer.limpiarAlertas();
      expect(observer.obtenerAlertas()).to.deep.equal([]);
    });

    it('solo acepta observadores que hereden de Observer', function () {
      const subject = new StockSubject();
      expect(() => subject.suscribir({ actualizar() {} }))
        .to.throw('Solo se pueden suscribir instancias de Observer.');
    });
  });
});
