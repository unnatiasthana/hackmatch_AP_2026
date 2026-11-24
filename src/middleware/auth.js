const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { HttpError } = require('./validate');

// After login the user gets a token. It holds their id and role,
// and it is signed with our secret, so nobody can change it.
function makeToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, { expiresIn: '1d' });
}

// AUTHENTICATION: who are you?
// The browser sends "Authorization: Bearer <token>".
function requireLogin(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return next(new HttpError(401, 'Please log in first'));
  }

  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, env.jwtSecret); // { id, role }
    next();
  } catch (error) {
    next(new HttpError(401, 'Your login is not valid any more. Please log in again'));
  }
}

// AUTHORIZATION: are you allowed to do this?
function onlyAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return next(new HttpError(403, 'Only an admin can do this'));
  }
  next();
}

// a student can change only their own skills, the admin can change anyone's
function onlySelfOrAdmin(req, res, next) {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return next(new HttpError(403, 'You can only change your own skills'));
  }
  next();
}

module.exports = { makeToken, requireLogin, onlyAdmin, onlySelfOrAdmin };
