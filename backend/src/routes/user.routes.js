const { Router } = require('express');
const controller = require('../controllers/user.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const rules = require('../middleware/validators');

const router = Router();
const adminOnly = authorize('admin');

router.use(authenticate);

router.get('/me', controller.getMe);
router.patch('/me', validate(rules.users.updateMe), controller.updateMe);

router.get('/grouped-by-interests', adminOnly, validate(rules.users.groupedByInterests), controller.groupedByInterests);

router.get('/', adminOnly, validate(rules.users.list), controller.listUsers);
router.post('/', adminOnly, validate(rules.users.create), controller.createUser);

router.get('/:id/posts', authorize('user', 'admin'), validate(rules.users.posts), controller.getUserPosts);

router.get('/:id', adminOnly, validate(rules.users.byId), controller.getUser);
router.patch('/:id', adminOnly, validate(rules.users.update), controller.updateUser);
router.delete('/:id', adminOnly, validate(rules.users.byId), controller.deleteUser);

module.exports = router;
