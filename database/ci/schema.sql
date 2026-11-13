CREATE TABLE laboratorios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  pais VARCHAR(100) NOT NULL,
  contacto VARCHAR(100),
  telefono VARCHAR(50),
  productos INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  productos INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE productos (
  id VARCHAR(10) PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  laboratorio VARCHAR(100),
  lote VARCHAR(50),
  stock INT DEFAULT 0,
  stock_minimo INT DEFAULT 0,
  precio DECIMAL(10,2),
  vencimiento DATE,
  estado ENUM('normal', 'bajo', 'agotado', 'vencido', 'activo', 'inactivo') NOT NULL DEFAULT 'normal',
  categoria VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  rol ENUM('Administrador', 'Supervisor', 'Vendedor') DEFAULT 'Vendedor',
  estado ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
  telefono VARCHAR(50),
  fecha_ingreso DATE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE compras (
  id VARCHAR(10) PRIMARY KEY,
  proveedor VARCHAR(150) NOT NULL,
  fecha DATE NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  estado ENUM('Pendiente', 'Recibido', 'Cancelado') DEFAULT 'Pendiente',
  productos TEXT,
  notas TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  dni VARCHAR(8) UNIQUE,
  direccion VARCHAR(255),
  telefono VARCHAR(50),
  estado ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
  fecha_registro DATE DEFAULT (CURRENT_DATE)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cliente_id INT NULL,
  cliente_nombre VARCHAR(150),
  cliente_doc VARCHAR(20),
  tipo_doc ENUM('Boleta', 'Factura') NOT NULL DEFAULT 'Boleta',
  metodo_pago ENUM('Efectivo', 'Tarjeta', 'Yape/Plin') NOT NULL DEFAULT 'Efectivo',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  igv DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  usuario_id INT NULL,
  estado ENUM('Completada', 'Anulada') NOT NULL DEFAULT 'Completada',
  CONSTRAINT fk_ci_ventas_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
  CONSTRAINT fk_ci_ventas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE venta_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  producto_id VARCHAR(10) NOT NULL,
  producto_nombre VARCHAR(150) NOT NULL,
  cantidad INT NOT NULL,
  precio_unit DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_ci_items_venta FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE historial_login (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  email VARCHAR(191) NOT NULL,
  nombre VARCHAR(150),
  rol VARCHAR(50),
  resultado ENUM('Exitoso', 'Fallido') NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  detalle VARCHAR(255),
  fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ci_historial_usuario (usuario_id),
  INDEX idx_ci_historial_email (email),
  INDEX idx_ci_historial_fecha (fecha_hora),
  INDEX idx_ci_historial_resultado (resultado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO laboratorios (nombre, pais) VALUES ('Laboratorio CI', 'Perú');
INSERT INTO categorias (nombre, descripcion) VALUES ('Categoría CI', 'Fixture de integración');
INSERT INTO productos
  (id, nombre, descripcion, laboratorio, lote, stock, stock_minimo, precio, vencimiento, estado, categoria)
VALUES
  ('CI001', 'Producto CI', 'Fixture de integración', 'Laboratorio CI', 'CI-001', 100, 5, 2.50, '2099-12-31', 'normal', 'Categoría CI');
