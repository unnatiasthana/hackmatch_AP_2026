const { Router } = require('express');

const router = Router();

router.use('/health', require('./health.routes'));
router.use('/users', require('./user.routes'));
router.use('/hackathons', require('./hackathon.routes'));
router.use('/skills', require('./skill.routes'));

module.exports = router;
