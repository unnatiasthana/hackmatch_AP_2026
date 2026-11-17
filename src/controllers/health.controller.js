const env = require('../config/env');

function getHealth(req, res) {
  res.status(200).json({
    success: true,
    message: 'HackMatch API is running',
    service: 'HackMatch',
    environment: env.nodeEnv,
  });
}

module.exports = { getHealth };
