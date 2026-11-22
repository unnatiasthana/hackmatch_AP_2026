const Hackathon = require('../models/hackathon.model');
const { normalizeSkills } = require('../middleware/validate');
const demoHackathons = require('../../data/hackathons.json');

// Each source returns a list of { title, link, start_date, tags }.
// For now there is one source: the dummy events in data/hackathons.json.
const sources = [{ name: 'demo', fetch: async () => demoHackathons }];

function clean(item) {
  if (!item || !item.title || !item.link) return null;
  if (!/^https?:\/\//.test(item.link)) return null;
  return {
    title: String(item.title).trim(),
    link: item.link,
    start_date: /^\d{4}-\d{2}-\d{2}$/.test(item.start_date) ? item.start_date : null,
    tags: normalizeSkills(item.tags),
  };
}

async function runIngestion(adapters = sources) {
  const summary = { saved: 0, skipped: 0, failedSources: [] };
  for (const src of adapters) {
    let items;
    try { items = await src.fetch(); } catch (e) {
      summary.failedSources.push({ source: src.name, error: e.message });
      continue;
    }
    for (const raw of items) {
      const item = clean(raw);
      if (!item) { summary.skipped++; continue; }
      try {
        await Hackathon.upsert(item);
        summary.saved++;
      } catch (e) {
        console.error(`[ingest] skipped ${item.title}: ${e.message || e.code}`);
        summary.skipped++;
      }
    }
  }
  return summary;
}

module.exports = { runIngestion, clean, sources };
