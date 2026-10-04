const { Router } = require('express');
const controller = require('../controllers/post.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const rules = require('../middleware/validators');

const router = Router();

router.use(authenticate, authorize('user', 'admin'));

router.get('/', validate(rules.posts.list), controller.listPosts);
router.post('/', validate(rules.posts.create), controller.createPost);
router.get('/:id', validate(rules.posts.byId), controller.getPost);
router.patch('/:id', validate(rules.posts.update), controller.updatePost);
router.delete('/:id', validate(rules.posts.byId), controller.deletePost);

module.exports = router;
