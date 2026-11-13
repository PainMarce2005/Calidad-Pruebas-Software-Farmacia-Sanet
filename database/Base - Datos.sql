CREATE DATABASE farmacia_sanet;
USE farmacia_sanet;

CREATE TABLE laboratorios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  pais VARCHAR(100) NOT NULL,
  contacto VARCHAR(100),
  telefono VARCHAR(50),
  productos INT DEFAULT 0
);

CREATE TABLE categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  productos INT DEFAULT 0
);

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
  estado ENUM('normal','bajo','agotado','vencido') DEFAULT 'normal',
  categoria VARCHAR(100)
);

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  rol ENUM('Administrador','Supervisor','Vendedor') DEFAULT 'Vendedor',
  estado ENUM('Activo','Inactivo') DEFAULT 'Activo',
  telefono VARCHAR(50),
  fecha_ingreso DATE
);

CREATE TABLE compras (
  id VARCHAR(10) PRIMARY KEY,
  proveedor VARCHAR(150) NOT NULL,
  fecha DATE NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  estado ENUM('Pendiente','Recibido','Cancelado') DEFAULT 'Pendiente',
  productos TEXT,
  notas TEXT
);

-- ============================================
-- LABORATORIOS
-- ============================================
INSERT INTO laboratorios (nombre, pais, contacto, telefono, productos) VALUES
('Bayer', 'Alemania', 'Hans Müller', '+49 30 468 000', 45),
('Pfizer', 'Estados Unidos', 'John Smith', '+1 212 733 2323', 67),
('Abbott', 'Estados Unidos', 'Sarah Johnson', '+1 312 667 6100', 32),
('Roemmers', 'Argentina', 'Carlos Roemmers', '+54 11 4340 0000', 28),
('GlaxoSmithKline', 'Reino Unido', 'James Wilson', '+44 20 8047 5000', 54),
('Novartis', 'Suiza', 'Klaus Fischer', '+41 61 324 1111', 41),
('Roche', 'Suiza', 'Anna Bauer', '+41 61 688 1111', 38),
('Sanofi', 'Francia', 'Pierre Dupont', '+33 1 53 77 40 00', 29);
 
-- ============================================
-- CATEGORIAS
-- ============================================
INSERT INTO categorias (nombre, descripcion, productos) VALUES
('Analgésicos', 'Medicamentos para el alivio del dolor agudo y crónico', 45),
('Antibióticos', 'Medicamentos para el tratamiento de infecciones bacterianas', 38),
('Antiinflamatorios', 'Medicamentos para reducir la inflamación y el dolor', 29),
('Cardiovasculares', 'Medicamentos para el sistema cardiovascular e hipertensión', 42),
('Antidiabéticos', 'Medicamentos para el control de la diabetes tipo 1 y 2', 24),
('Digestivos', 'Medicamentos para el sistema digestivo y gastritis', 31),
('Respiratorios', 'Medicamentos para afecciones respiratorias y asma', 27),
('Vitaminas', 'Suplementos vitamínicos y minerales', 35),
('Dermatológicos', 'Medicamentos para afecciones de la piel', 18),
('Antihistamínicos', 'Medicamentos para alergias y reacciones alérgicas', 22);
 
-- ============================================
-- PRODUCTOS
-- ============================================
INSERT INTO productos (id, nombre, descripcion, laboratorio, lote, stock, stock_minimo, precio, vencimiento, estado, categoria) VALUES
('P001', 'Paracetamol 500mg', 'Analgésico y antipirético de uso común', 'Bayer', 'L2024-089', 500, 100, 0.50, '2027-08-15', 'normal', 'Analgésicos'),
('P002', 'Ibuprofeno 400mg', 'Antiinflamatorio no esteroideo', 'Pfizer', 'L2024-067', 78, 80, 0.80, '2026-12-22', 'bajo', 'Antiinflamatorios'),
('P003', 'Amoxicilina 500mg', 'Antibiótico de amplio espectro', 'Abbott', 'L2024-045', 150, 50, 1.50, '2027-03-10', 'normal', 'Antibióticos'),
('P004', 'Omeprazol 20mg', 'Inhibidor de la bomba de protones para gastritis', 'Roemmers', 'L2024-123', 0, 30, 1.20, '2027-01-10', 'agotado', 'Digestivos'),
('P005', 'Losartán 50mg', 'Antihipertensivo antagonista de receptores de angiotensina II', 'Bayer', 'L2024-098', 12, 50, 2.00, '2026-11-30', 'bajo', 'Cardiovasculares'),
('P006', 'Metformina 850mg', 'Antidiabético oral para diabetes tipo 2', 'Pfizer', 'L2024-156', 8, 30, 0.90, '2027-03-20', 'bajo', 'Antidiabéticos'),
('P007', 'Atorvastatina 20mg', 'Reductor del colesterol tipo estatina', 'GlaxoSmithKline', 'L2024-201', 220, 60, 3.50, '2027-06-15', 'normal', 'Cardiovasculares'),
('P008', 'Azitromicina 500mg', 'Antibiótico macrólido de amplio espectro', 'Abbott', 'L2024-178', 95, 40, 4.20, '2026-09-30', 'normal', 'Antibióticos'),
('P009', 'Salbutamol 100mcg Inhalador', 'Broncodilatador para asma y EPOC', 'GlaxoSmithKline', 'L2024-234', 45, 20, 12.00, '2027-02-28', 'normal', 'Respiratorios'),
('P010', 'Vitamina C 500mg', 'Suplemento vitamínico antioxidante', 'Roemmers', 'L2024-312', 600, 150, 0.30, '2028-01-10', 'normal', 'Vitaminas'),
('P011', 'Diclofenaco 50mg', 'Antiinflamatorio y analgésico para dolor muscular', 'Novartis', 'L2024-267', 180, 60, 0.60, '2027-05-20', 'normal', 'Antiinflamatorios'),
('P012', 'Enalapril 10mg', 'Inhibidor de la ECA para hipertensión arterial', 'Pfizer', 'L2024-289', 25, 40, 1.80, '2026-08-15', 'bajo', 'Cardiovasculares'),
('P013', 'Cetirizina 10mg', 'Antihistamínico para alergias estacionales', 'Bayer', 'L2024-345', 310, 80, 0.70, '2027-09-25', 'normal', 'Antihistamínicos'),
('P014', 'Ranitidina 150mg', 'Antiulceroso para tratamiento de úlceras gástricas', 'Sanofi', 'L2024-198', 0, 35, 0.90, '2027-04-12', 'agotado', 'Digestivos'),
('P015', 'Hidrocortisona Crema 1%', 'Corticosteroide tópico para dermatitis', 'Roche', 'L2024-421', 55, 25, 8.50, '2026-07-30', 'normal', 'Dermatológicos');
 
-- ============================================
-- USUARIOS
-- ============================================
INSERT INTO usuarios (nombre, email, rol, estado, telefono, fecha_ingreso) VALUES
('Admin Principal', 'admin@farmaciasanet.com', 'Administrador', 'Activo', '+51 999 111 222', '2022-01-15'),
('María González', 'maria.g@farmaciasanet.com', 'Vendedor', 'Activo', '+51 999 333 444', '2023-03-01'),
('Carlos Pérez', 'carlos.p@farmaciasanet.com', 'Vendedor', 'Activo', '+51 999 555 666', '2023-06-15'),
('Ana Rodríguez', 'ana.r@farmaciasanet.com', 'Supervisor', 'Inactivo', '+51 999 777 888', '2022-09-10'),
('Luis Torres', 'luis.t@farmaciasanet.com', 'Vendedor', 'Activo', '+51 999 000 111', '2024-01-08'),
('Rosa Mamani', 'rosa.m@farmaciasanet.com', 'Supervisor', 'Activo', '+51 998 222 333', '2023-11-20'),
('Jorge Castillo', 'jorge.c@farmaciasanet.com', 'Vendedor', 'Activo', '+51 998 444 555', '2024-03-05'),
('Patricia Vega', 'patricia.v@farmaciasanet.com', 'Administrador', 'Activo', '+51 998 666 777', '2021-07-12');
 
-- ============================================
-- COMPRAS
-- ============================================
INSERT INTO compras (id, proveedor, fecha, total, estado, productos, notas) VALUES
('C001', 'Droguería del Sur SAC', '2026-04-08', 5420.00, 'Recibido', 'Paracetamol x500, Ibuprofeno x300', 'Entrega en perfecto estado'),
('C002', 'Farmadist S.A.', '2026-04-05', 8950.00, 'Recibido', 'Amoxicilina x200, Losartán x150, Enalapril x200', 'Factura N° 001-00456'),
('C003', 'Albis S.A.', '2026-04-03', 3200.00, 'Pendiente', 'Omeprazol x400', 'Pendiente confirmación de entrega'),
('C004', 'Representaciones Médicas SAC', '2026-03-28', 12500.00, 'Recibido', 'Metformina x600, Enalapril x400, Atorvastatina x300', 'Entrega parcial - completar siguiente semana'),
('C005', 'Droguería del Sur SAC', '2026-03-20', 1800.00, 'Cancelado', 'Azitromicina x100', 'Cancelado por desabastecimiento del proveedor'),
('C006', 'Medifarma S.A.', '2026-03-15', 6750.00, 'Recibido', 'Cetirizina x500, Salbutamol x80, Vitamina C x1000', 'Todo conforme'),
('C007', 'Farmadist S.A.', '2026-03-10', 4320.00, 'Recibido', 'Diclofenaco x400, Hidrocortisona x60', 'Verificar fecha de vencimiento Hidrocortisona'),
('C008', 'Albis S.A.', '2026-04-15', 9800.00, 'Pendiente', 'Losartán x300, Metformina x400, Paracetamol x800', 'Orden de compra OC-2026-089');



-- ============================================================
-- EXAMEN T2 . CAMBIOS Y AGREGACION EN LA BASE DE DATOS
--  MIGRACIÓN: Sistema de Autenticación y Control de Acceso
--  Farmacia Sanet
-- ============================================================

-- 1. Agregar columna password_hash de forma segura en MySQL
DROP PROCEDURE IF EXISTS AddPasswordHashColumn;

DELIMITER //

CREATE PROCEDURE AddPasswordHashColumn()
BEGIN
    -- Verificamos si la columna NO existe en la base de datos actual
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'usuarios' 
          AND COLUMN_NAME = 'password_hash'
    ) THEN
        -- Si no existe, la creamos
        ALTER TABLE usuarios ADD COLUMN password_hash VARCHAR(255) NULL AFTER email;
    END IF;
END //

DELIMITER ;

-- Ejecutamos el procedimiento y luego lo borramos para no dejar basura
CALL AddPasswordHashColumn();
DROP PROCEDURE AddPasswordHashColumn;


-- 2. Insertar / actualizar usuarios de prueba con contraseñas hasheadas
INSERT INTO usuarios (nombre, email, password_hash, rol, estado, telefono, fecha_ingreso)
VALUES
  ('Administrador Sistema', 'admin@farmacia.com', '$2a$10$placeholder_run_seed_script', 'Administrador', 'Activo', '999000001', CURDATE()),
  ('Supervisor Almacén',    'supervisor@farmacia.com', '$2a$10$placeholder_run_seed_script', 'Supervisor',    'Activo', '999000002', CURDATE()),
  ('Vendedor Principal',    'vendedor@farmacia.com',   '$2a$10$placeholder_run_seed_script', 'Vendedor',      'Activo', '999000003', CURDATE())
AS new_data 
ON DUPLICATE KEY UPDATE 
  nombre = new_data.nombre,
  password_hash = new_data.password_hash;
  
-- ============================================================
--  Tabla clientes
-- ============================================================

CREATE TABLE IF NOT EXISTS clientes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(150) NOT NULL,
  dni             VARCHAR(8)   NULL UNIQUE,
  direccion       VARCHAR(255) NULL,
  telefono        VARCHAR(50)  NULL,
  estado          ENUM('Activo','Inactivo') DEFAULT 'Activo',
  fecha_registro  DATE DEFAULT (CURRENT_DATE)
);

-- Datos para tabla cliente
INSERT INTO clientes (nombre, dni, direccion, telefono, estado) VALUES
('Juan Pérez Torres',       '45123678', 'Av. España 123, Trujillo',        '+51 944 111 222', 'Activo'),
('María Silva Rodríguez',   '32567890', 'Jr. Bolívar 456, Trujillo',       '+51 944 333 444', 'Activo'),
('Carlos Mendoza López',    '71234567', 'Urb. El Golf Mz. B Lt. 5',        '+51 944 555 666', 'Activo'),
('Rosa Vásquez Chávez',     '60987654', 'Av. Larco 789, Víctor Larco',     '+51 944 777 888', 'Activo'),
('Luis Castillo Ruiz',      '48765432', 'Calle Real 321, Huanchaco',       '+51 944 999 000', 'Inactivo'),
('Ana Torres Flores',       '55443322', 'Jr. Independencia 654',           '+51 943 111 222', 'Activo'),
('Pedro Quispe Mamani',     NULL,       'Av. Mansiche 987, Trujillo',      '+51 943 333 444', 'Activo'),
('Gloria Herrera Palacios', '69112233', 'Jr. Pizarro 147, Centro',         NULL,              'Activo');

-- Tabla principal de ventas
CREATE TABLE IF NOT EXISTS ventas (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  fecha         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cliente_id    INT NULL,
  cliente_nombre VARCHAR(150) NULL,
  cliente_doc   VARCHAR(20)  NULL,
  tipo_doc      ENUM('Boleta','Factura') NOT NULL DEFAULT 'Boleta',
  metodo_pago   ENUM('Efectivo','Tarjeta','Yape/Plin') NOT NULL DEFAULT 'Efectivo',
  subtotal      DECIMAL(10,2) NOT NULL DEFAULT 0,
  igv           DECIMAL(10,2) NOT NULL DEFAULT 0,
  total         DECIMAL(10,2) NOT NULL DEFAULT 0,
  usuario_id    INT NULL,
  estado        ENUM('Completada','Anulada') NOT NULL DEFAULT 'Completada',
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Detalle de cada ítem dentro de una venta
CREATE TABLE IF NOT EXISTS venta_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  venta_id      INT NOT NULL,
  producto_id   VARCHAR(10) NOT NULL,
  producto_nombre VARCHAR(150) NOT NULL,
  cantidad      INT NOT NULL,
  precio_unit   DECIMAL(10,2) NOT NULL,
  subtotal      DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
);

-- MEJORAS QUE SE REALIZO EN LA SEGURIDAD 
ALTER TABLE usuarios ADD CONSTRAINT uq_usuarios_email UNIQUE (email);

-- Tabla historial_login 
CREATE TABLE IF NOT EXISTS historial_login (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  usuario_id    INT             NULL,            -- NULL si el email no existe
  email         VARCHAR(191)    NOT NULL,        -- email ingresado en el intento
  nombre        VARCHAR(150)    NULL,            -- nombre del usuario (si existe)
  rol           VARCHAR(50)     NULL,            -- rol (si existe)
  resultado     ENUM('Exitoso','Fallido') NOT NULL,
  ip_address    VARCHAR(45)     NULL,            -- IPv4 o IPv6
  user_agent    TEXT            NULL,            -- navegador/dispositivo
  detalle       VARCHAR(255)    NULL,            -- motivo del fallo si aplica
  fecha_hora    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_usuario_id  (usuario_id),
  INDEX idx_email       (email),
  INDEX idx_fecha_hora  (fecha_hora),
  INDEX idx_resultado   (resultado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

