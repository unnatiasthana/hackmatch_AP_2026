const { Router } = require('express');
const c = require('../controllers/hackathon.controller');
const { uuidParam } = require('../middleware/validate');

const router = Router();

router.get('/', c.listHackathons);
router.post('/', c.createHackathon);
router.get('/upcoming', c.upcoming);
router.get('/:id', uuidParam(), c.getHackathon);
router.get('/:id/matching-users', uuidParam(), c.matchingUsers);

module.exports = router;
