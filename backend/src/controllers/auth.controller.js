const authService = require('../services/auth.service');

async function register(req, res) {
  const { user, token } = await authService.register(req.valid.body);
  res.status(201).json({ data: { user, token } });
}

async function login(req, res) {
  const { user, token } = await authService.login(req.valid.body);
  res.json({ data: { user, token } });
}

module.exports = { register, login };
