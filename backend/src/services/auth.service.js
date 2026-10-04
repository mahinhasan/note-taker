const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/token');

const INVALID_CREDENTIALS = 'Invalid email or password';

async function register({ name, email, password, interests = [] }) {
  const passwordHash = await hashPassword(password);
  const user = await User.create({ name, email, passwordHash, interests, role: 'user' });
  return { user, token: signToken(user) };
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const valid = await comparePassword(password, user && user.passwordHash);
  if (!user || !valid) {
    throw ApiError.unauthorized(INVALID_CREDENTIALS);
  }
  return { user, token: signToken(user) };
}

module.exports = { register, login };
