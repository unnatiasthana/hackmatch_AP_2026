const { Router } = require('express');
const c = require('../controllers/auth.controller');
const { requireLogin } = require('../middleware/auth');

const router = Router();

router.post('/login', c.login);
router.get('/me', requireLogin, c.me);

module.exports = router;
