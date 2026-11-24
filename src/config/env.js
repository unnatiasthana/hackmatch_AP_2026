const dotenv = require('dotenv');

dotenv.config({ quiet: true });

const nodeEnv = process.env.NODE_ENV || 'development';

// The secret key that signs login tokens. Anyone who knows it can make fake tokens,
// so the live site must set its own JWT_SECRET.
if (!process.env.JWT_SECRET && nodeEnv === 'production') {
  throw new Error('JWT_SECRET must be set in production');
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: nodeEnv,
  jwtSecret: process.env.JWT_SECRET || 'only-for-local-testing',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/hackmatch_db',
  ingestCron: process.env.INGEST_CRON || '0 */6 * * *',
  enableIngestCron: process.env.ENABLE_INGEST_CRON === 'true',
};
