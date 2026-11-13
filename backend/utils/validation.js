const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = new Set(['Administrador', 'Supervisor', 'Vendedor']);

function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_PATTERN.test(value.trim());
}

function isValidRole(value) {
  return typeof value === 'string' && VALID_ROLES.has(value);
}

module.exports = { isValidEmail, isValidRole };
