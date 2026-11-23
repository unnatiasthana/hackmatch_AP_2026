const User = require('../models/user.model');
const Hackathon = require('../models/hackathon.model');
const { HttpError, normalizeSkill } = require('../middleware/validate');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });

async function listUsers(req, res, next) {
  try { ok(res, await User.findAll()); } catch (e) { next(e); }
}

async function createUser(req, res, next) {
  try {
    const { name, email, college } = req.body || {};
    if (typeof name !== 'string' || !name.trim()) throw new HttpError(400, 'name is required');
    if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      throw new HttpError(400, 'A valid email is required');
    }
    // check first, so a failed signup does not add a college
    if (await User.emailExists(email.trim().toLowerCase())) {
      throw new HttpError(409, 'A user with this email already exists');
    }
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      college: typeof college === 'string' && college.trim() ? college.trim() : null,
    });
    ok(res, user, 201);
  } catch (e) {
    if (e.code === '23505') return next(new HttpError(409, 'A user with this email already exists'));
    next(e);
  }
}

async function getUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new HttpError(404, `User ${req.params.id} not found`);
    ok(res, user);
  } catch (e) { next(e); }
}

async function addSkill(req, res, next) {
  try {
    const skill = normalizeSkill(req.body && req.body.skill);
    if (!skill) throw new HttpError(400, 'skill is required');
    if (!(await User.findById(req.params.id))) throw new HttpError(404, 'User not found');
    await User.addSkill(req.params.id, skill);
    ok(res, await User.findById(req.params.id), 201);
  } catch (e) { next(e); }
}

async function removeSkill(req, res, next) {
  try {
    const skill = normalizeSkill(req.params.skill);
    if (!(await User.removeSkill(req.params.id, skill))) {
      throw new HttpError(404, 'User does not have that skill');
    }
    ok(res, await User.findById(req.params.id));
  } catch (e) { next(e); }
}

async function getRecommendations(req, res, next) {
  try {
    if (!(await User.findById(req.params.id))) throw new HttpError(404, 'User not found');
    const upcomingOnly = req.query.include_past !== 'true';
    ok(res, await Hackathon.recommendFor(req.params.id, { upcomingOnly }));
  } catch (e) { next(e); }
}

async function leaderboard(req, res, next) {
  try { ok(res, await User.collegeLeaderboard()); } catch (e) { next(e); }
}

module.exports = {
  listUsers, createUser, getUser, addSkill, removeSkill, getRecommendations, leaderboard,
};
