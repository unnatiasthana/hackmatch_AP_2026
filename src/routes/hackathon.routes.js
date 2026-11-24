const { Router } = require('express');
const c = require('../controllers/hackathon.controller');
const { uuidParam } = require('../middleware/validate');
const { requireLogin, onlyAdmin } = require('../middleware/auth');

const router = Router();

router.get('/', c.listHackathons);
// only a logged in admin can add hackathons
router.post('/', requireLogin, onlyAdmin, c.createHackathon);
router.get('/upcoming', c.upcoming);
router.get('/:id', uuidParam(), c.getHackathon);
router.get('/:id/matching-users', uuidParam(), c.matchingUsers);

module.exports = router;
