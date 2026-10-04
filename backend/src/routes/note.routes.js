const { Router } = require('express');
const controller = require('../controllers/note.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const rules = require('../middleware/validators');

const router = Router();

router.use(authenticate, authorize('user', 'admin'));

router.get('/', validate(rules.notes.list), controller.listNotes);
router.post('/', validate(rules.notes.create), controller.createNote);
router.get('/:id', validate(rules.notes.byId), controller.getNote);
router.patch('/:id', validate(rules.notes.update), controller.updateNote);
router.delete('/:id', validate(rules.notes.byId), controller.deleteNote);

module.exports = router;
