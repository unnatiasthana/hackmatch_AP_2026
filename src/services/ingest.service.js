const axios = require('axios');
const cheerio = require('cheerio');
const Hackathon = require('../models/hackathon.model');
const { normalizeSkills } = require('../middleware/validate');

// Source adapters return [{ title, link, start_date, tags }].
// Real scrapers (Unstop, Devpost) plug in here; they must not crash the job.
// Adapted from the original scraper.js (Devpost listing page).
const devpost = {
  name: 'devpost',
  async fetch() {
    const { data } = await axios.get('https://devpost.com/hackathons', { timeout: 15000 });
    const $ = cheerio.load(data);
    const items = [];
    $('.hackathon-tile').each((_, el) => {
      const title = $(el).find('h3').text().trim();
      const link = $(el).attr('href') || $(el).find('a').attr('href');
      // Listing pages only give a date range string, not a parseable date; tags are generic for now.
      items.push({ title, link, start_date: null, tags: ['javascript', 'web dev', 'gen ai'] });
    });
    return items;
  },
};

const sources = [
  {
    name: 'sample',
    async fetch() {
      return [
        { title: 'AI Sprint', link: 'https://unstop.com/ai-sprint', start_date: '2026-12-05', tags: ['Gen AI', 'Python'] },
        { title: 'ChainFest', link: 'https://devpost.com/chainfest', start_date: '2026-12-12', tags: ['Web3'] },
      ];
    },
  },
];

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
        console.error(`[ingest] skipped ${item.title}: ${e.message}`);
        summary.skipped++;
      }
    }
  }
  return summary;
}

module.exports = { runIngestion, clean, sources, devpost };
