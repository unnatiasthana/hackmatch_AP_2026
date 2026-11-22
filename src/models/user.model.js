const db = require('../config/db');

async function emailExists(email) {
  const result = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  return result.rows.length > 0;
}

// 'IIT Delhi' and 'iit delhi' are the same college
async function getCollegeId(name) {
  const found = await db.query('SELECT id FROM colleges WHERE lower(name) = lower($1)', [name]);
  if (found.rows.length > 0) return found.rows[0].id;

  const added = await db.query('INSERT INTO colleges (name) VALUES ($1) RETURNING id', [name]);
  return added.rows[0].id;
}

async function create({ name, email, college }) {
  let collegeId = null;
  if (college) {
    collegeId = await getCollegeId(college);
  }
  const r = await db.query(
    `INSERT INTO users (name, email, college_id) VALUES ($1, $2, $3) RETURNING id`,
    [name, email, collegeId]
  );
  return findById(r.rows[0].id);
}

// Q2: full profile with skills
async function findById(id) {
  const r = await db.query(
    `SELECT u.id, u.name, c.name AS college,
            COALESCE(ARRAY_AGG(s.name ORDER BY s.name) FILTER (WHERE s.id IS NOT NULL), '{}') AS skills
     FROM users u
     LEFT JOIN colleges c ON c.id = u.college_id
     LEFT JOIN user_skills us ON us.user_id = u.id
     LEFT JOIN skills s ON s.id = us.skill_id
     WHERE u.id = $1
     GROUP BY u.id, u.name, c.name`,
    [id]
  );
  return r.rows[0] || null;
}

async function findAll() {
  const r = await db.query(
    `SELECT u.id, u.name, c.name AS college
     FROM users u LEFT JOIN colleges c ON c.id = u.college_id
     ORDER BY u.name`
  );
  return r.rows;
}

// Q3: upsert-safe skill add
async function addSkill(userId, skill) {
  await db.query(`INSERT INTO skills (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [skill]);
  await db.query(
    `INSERT INTO user_skills (user_id, skill_id)
     SELECT $1, id FROM skills WHERE name = $2
     ON CONFLICT DO NOTHING`,
    [userId, skill]
  );
}

// Q9
async function removeSkill(userId, skill) {
  const r = await db.query(
    `DELETE FROM user_skills
     WHERE user_id = $1 AND skill_id = (SELECT id FROM skills WHERE name = $2)`,
    [userId, skill]
  );
  return r.rowCount > 0;
}

// Q10
async function collegeLeaderboard() {
  const r = await db.query(
    `SELECT c.name AS college, COUNT(u.id)::int AS user_count
     FROM colleges c LEFT JOIN users u ON u.college_id = c.id
     GROUP BY c.id ORDER BY user_count DESC, c.name`
  );
  return r.rows;
}

module.exports = { create, emailExists, findById, findAll, addSkill, removeSkill, collegeLeaderboard };
