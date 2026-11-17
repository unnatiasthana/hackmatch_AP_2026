const { Router } = require('express');
const c = require('../controllers/hackathon.controller');

const router = Router();
router.get('/', c.listSkills);
router.get('/trending', c.trending);
module.exports = router;
