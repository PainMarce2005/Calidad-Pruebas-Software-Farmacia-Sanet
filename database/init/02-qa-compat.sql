ALTER TABLE productos
  MODIFY COLUMN estado ENUM(
    'activo',
    'inactivo',
    'agotado',
    'normal',
    'bajo',
    'vencido'
  ) NOT NULL DEFAULT 'normal';
