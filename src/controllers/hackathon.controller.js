const Hackathon = require('../models/hackathon.model');
const { HttpError, normalizeSkill, normalizeSkills } = require('../middleware/validate');

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });

function validateHackathon(body = {}) {
  const { title, link, start_date, tags } = body;
  if (typeof title !== 'string' || !title.trim()) throw new HttpError(400, 'title is required');
  let url;
  try { url = new URL(link); } catch { throw new HttpError(400, 'link must be a valid URL'); }
  if (!/^https?:$/.test(url.protocol)) throw new HttpError(400, 'link must be http(s)');
  if (start_date != null && !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
    throw new HttpError(400, 'start_date must be YYYY-MM-DD');
  }
  return { title: title.trim(), link: url.href, start_date: start_date || null, tags: normalizeSkills(tags) };
}

async function listHackathons(req, res, next) {
  try {
    const tag = req.query.tag ? normalizeSkill(req.query.tag) : undefined;
    ok(res, await Hackathon.findAll({ tag }));
  } catch (e) { next(e); }
}

async function getHackathon(req, res, next) {
  try {
    const h = await Hackathon.findById(req.params.id);
    if (!h) throw new HttpError(404, `Hackathon ${req.params.id} not found`);
    ok(res, h);
  } catch (e) { next(e); }
}

async function createHackathon(req, res, next) {
  try {
    const id = await Hackathon.upsert(validateHackathon(req.body));
    ok(res, await Hackathon.findById(id), 201);
  } catch (e) { next(e); }
}

async function upcoming(req, res, next) {
  try {
    const days = Number(req.query.days ?? 30);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      throw new HttpError(400, 'days must be an integer between 1 and 365');
    }
    ok(res, await Hackathon.upcoming(days));
  } catch (e) { next(e); }
}

async function matchingUsers(req, res, next) {
  try {
    if (!(await Hackathon.findById(req.params.id))) throw new HttpError(404, 'Hackathon not found');
    ok(res, await Hackathon.matchingUsers(req.params.id));
  } catch (e) { next(e); }
}

async function trending(req, res, next) {
  try { ok(res, await Hackathon.trendingSkills()); } catch (e) { next(e); }
}

async function listSkills(req, res, next) {
  try { ok(res, await Hackathon.allSkills()); } catch (e) { next(e); }
}

module.exports = {
  listHackathons, getHackathon, createHackathon, upcoming, matchingUsers, trending, listSkills,
  validateHackathon,
};
