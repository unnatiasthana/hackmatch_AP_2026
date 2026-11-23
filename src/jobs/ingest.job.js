const cron = require('node-cron');
const env = require('../config/env');
const { runIngestion } = require('../services/ingest.service');

async function runOnce() {
  const s = await runIngestion();
  console.log(`[ingest] saved=${s.saved} skipped=${s.skipped} failedSources=${s.failedSources.length}`);
  return s;
}

function startIngestCron() {
  cron.schedule(env.ingestCron, () => runOnce().catch((e) => console.error('[ingest] failed:', e)));
  console.log(`[ingest] scheduled: ${env.ingestCron}`);
}

module.exports = { startIngestCron, runOnce };

// `npm run ingest` runs it once and exits.
if (require.main === module) {
  runOnce()
    .then((result) => {
      if (result.saved === 0) process.exitCode = 1;
      return require('../config/db').end();
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
