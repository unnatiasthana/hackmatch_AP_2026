const dotenv = require('dotenv');

dotenv.config({ quiet: true });

module.exports = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/hackmatch_db',
  ingestCron: process.env.INGEST_CRON || '0 */6 * * *',
  enableIngestCron: process.env.ENABLE_INGEST_CRON === 'true',
};
