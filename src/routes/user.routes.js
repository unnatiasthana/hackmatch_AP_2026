const { Router } = require('express');
const c = require('../controllers/user.controller');
const { uuidParam } = require('../middleware/validate');

const router = Router();

router.get('/', c.listUsers);
router.post('/', c.createUser);
router.get('/leaderboard/colleges', c.leaderboard);
router.get('/:id', uuidParam(), c.getUser);
router.post('/:id/skills', uuidParam(), c.addSkill);
router.delete('/:id/skills/:skill', uuidParam(), c.removeSkill);
router.get('/:id/recommendations', uuidParam(), c.getRecommendations);

module.exports = router;
