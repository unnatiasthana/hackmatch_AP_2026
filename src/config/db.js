const { Pool, types } = require('pg');
const env = require('./env');

// 1082 = DATE. Keep it as plain text, otherwise India sees it one day early.
types.setTypeParser(1082, (value) => value);

const pool = new Pool({ connectionString: env.databaseUrl });

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

module.exports = pool;
