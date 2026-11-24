const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const { HttpError } = require('../middleware/validate');
const { makeToken } = require('../middleware/auth');

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new HttpError(400, 'email and password are required');
    }

    const user = await User.findForLogin(email.trim().toLowerCase());

    // bcrypt hashes the typed password again and compares the two hashes
    const passwordOk = user && (await bcrypt.compare(password, user.password_hash));

    // same message for a wrong email and a wrong password,
    // so nobody can find out which emails are registered
    if (!passwordOk) throw new HttpError(401, 'Wrong email or password');

    res.json({
      success: true,
      data: {
        token: makeToken(user),
        user: { id: user.id, name: user.name, role: user.role },
      },
    });
  } catch (e) { next(e); }
}

// who is logged in right now (needs requireLogin before it)
async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw new HttpError(401, 'This account does not exist any more');
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
}

module.exports = { login, me };
