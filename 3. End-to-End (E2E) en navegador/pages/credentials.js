require('dotenv').config({
  path: require('path').join(__dirname, '..', '..', '.env'),
  quiet: true,
});

const DEFAULT_CREDENTIALS = Object.freeze({
  admin: {
    email: 'admin@farmacia.com',
    password: 'Admin123!',
  },
  supervisor: {
    email: 'supervisor@farmacia.com',
    password: 'Super123!',
  },
  seller: {
    email: 'vendedor@farmacia.com',
    password: 'Vende123!',
  },
});

const ENVIRONMENT_VARIABLES = Object.freeze({
  admin: ['TEST_ADMIN_EMAIL', 'TEST_ADMIN_PASSWORD'],
  supervisor: ['TEST_SUPERVISOR_EMAIL', 'TEST_SUPERVISOR_PASSWORD'],
  seller: ['TEST_SELLER_EMAIL', 'TEST_SELLER_PASSWORD'],
});

function getCredentials(role) {
  const defaults = DEFAULT_CREDENTIALS[role];
  const variables = ENVIRONMENT_VARIABLES[role];

  if (!defaults || !variables) {
    throw new Error(`Rol de credenciales E2E desconocido: ${role}`);
  }

  const [emailVariable, passwordVariable] = variables;
  return {
    email: process.env[emailVariable] || defaults.email,
    password: process.env[passwordVariable] || defaults.password,
  };
}

module.exports = { getCredentials };
