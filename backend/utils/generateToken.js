const jwt = require('jsonwebtoken');
const { normalizeRole } = require('./roleUtils');

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role: normalizeRole(role) },
    process.env.JWT_SECRET || 'service_desk_super_secret_jwt_key_2026',
    { expiresIn: '30d' }
  );
};

module.exports = generateToken;
