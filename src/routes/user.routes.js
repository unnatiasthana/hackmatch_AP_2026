const { Router } = require('express');
const c = require('../controllers/user.controller');
const { uuidParam } = require('../middleware/validate');
const { requireLogin, onlySelfOrAdmin } = require('../middleware/auth');

const router = Router();

router.get('/', c.listUsers);
router.post('/', c.createUser);
router.get('/leaderboard/colleges', c.leaderboard);
router.get('/:id', uuidParam(), c.getUser);
// changing skills: you must be logged in (401) and it must be you (403)
router.post('/:id/skills', uuidParam(), requireLogin, onlySelfOrAdmin, c.addSkill);
router.delete('/:id/skills/:skill', uuidParam(), requireLogin, onlySelfOrAdmin, c.removeSkill);
router.get('/:id/recommendations', uuidParam(), c.getRecommendations);

module.exports = router;
