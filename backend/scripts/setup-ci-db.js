const fs = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2/promise');

async function setupCiDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  try {
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'ci', 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    await connection.query(schema);
    console.log('Esquema de CI creado con datos sintéticos.');
  } finally {
    await connection.end();
  }
}

setupCiDatabase().catch((error) => {
  console.error('No se pudo preparar la base de CI:', error);
  process.exitCode = 1;
});
