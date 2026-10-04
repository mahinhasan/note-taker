const bcrypt = require('bcrypt');
const { bcryptCost } = require('../config/env');

const DUMMY_HASH = bcrypt.hashSync('timing-equalizer-placeholder', bcryptCost);

function hashPassword(plain) {
  return bcrypt.hash(plain, bcryptCost);
}

function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash || DUMMY_HASH);
}

module.exports = { hashPassword, comparePassword };
