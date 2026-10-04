const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/env');

const ALGORITHM = 'HS256';

function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, jwtSecret, {
    algorithm: ALGORITHM,
    expiresIn: jwtExpiresIn,
  });
}

function verifyToken(token) {
  return jwt.verify(token, jwtSecret, { algorithms: [ALGORITHM] });
}

module.exports = { signToken, verifyToken };
