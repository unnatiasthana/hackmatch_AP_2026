const app = require('./app');
const env = require('./config/env');
const db = require('./config/db');
const { startIngestCron } = require('./jobs/ingest.job');

app.listen(env.port, (err) => {
  if (err) {
    console.error(
      err.code === 'EADDRINUSE'
        ? `Port ${env.port} is already in use. Set a different PORT in .env.`
        : `Failed to start server: ${err.message}`
    );
    process.exit(1);
  }
  console.log(`HackMatch API running on http://localhost:${env.port} (${env.nodeEnv})`);

  db.query('SELECT 1')
    .then(() => console.log('Connected to PostgreSQL database'))
    .catch((e) => console.warn('Warning: could not connect to PostgreSQL:', e.message));

  if (env.enableIngestCron) startIngestCron();
});
