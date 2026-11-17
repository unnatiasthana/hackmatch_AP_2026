const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function isUuid(v) {
  return typeof v === 'string' && UUID_RE.test(v);
}

// Router param guard: rejects non-UUID ids with 400 before hitting the DB.
function uuidParam(name = 'id') {
  return (req, res, next) => {
    if (!isUuid(req.params[name])) {
      return next(new HttpError(400, `Invalid ${name}: must be a UUID`));
    }
    next();
  };
}

// Skills are stored lowercase + trimmed (matches schema convention).
function normalizeSkill(raw) {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : '';
}

function normalizeSkills(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map(normalizeSkill).filter(Boolean))];
}

module.exports = { HttpError, isUuid, uuidParam, normalizeSkill, normalizeSkills };
