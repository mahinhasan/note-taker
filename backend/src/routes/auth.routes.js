const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimiter');
const rules = require('../middleware/validators');

const router = Router();

router.post('/register', validate(rules.auth.register), controller.register);
router.post('/login', loginLimiter, validate(rules.auth.login), controller.login);

module.exports = router;
