const db = require('../config/db');

const WITH_TAGS = `
  SELECT h.id, h.title, h.link, h.start_date,
         COALESCE(ARRAY_AGG(s.name ORDER BY s.name) FILTER (WHERE s.id IS NOT NULL), '{}') AS tags
  FROM hackathons h
  LEFT JOIN hackathon_skills hs ON hs.hackathon_id = h.id
  LEFT JOIN skills s ON s.id = hs.skill_id`;

async function findAll({ tag } = {}) {
  const params = [];
  let where = '';
  if (tag) {
    params.push(tag);
    where = `WHERE h.id IN (SELECT hs2.hackathon_id FROM hackathon_skills hs2
                            JOIN skills s2 ON s2.id = hs2.skill_id WHERE s2.name = $1)`;
  }
  const r = await db.query(
    `${WITH_TAGS} ${where} GROUP BY h.id ORDER BY h.start_date ASC NULLS LAST`,
    params
  );
  return r.rows;
}

async function findById(id) {
  const r = await db.query(`${WITH_TAGS} WHERE h.id = $1 GROUP BY h.id`, [id]);
  return r.rows[0] || null;
}

// Q8
async function upcoming(days = 30) {
  const r = await db.query(
    `${WITH_TAGS}
     WHERE h.start_date BETWEEN CURRENT_DATE AND CURRENT_DATE + make_interval(days => $1)
     GROUP BY h.id ORDER BY h.start_date ASC`,
    [days]
  );
  return r.rows;
}

// Q4 + Q5: upsert hackathon on link, then tag it. Runs in one transaction.
async function upsert({ title, link, start_date, tags = [] }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const h = await client.query(
      `INSERT INTO hackathons (title, link, start_date) VALUES ($1, $2, $3)
       ON CONFLICT (link) DO UPDATE SET title = EXCLUDED.title, start_date = EXCLUDED.start_date
       RETURNING id`,
      [title, link, start_date || null]
    );
    const id = h.rows[0].id;
    for (const tag of tags) {
      await client.query(`INSERT INTO skills (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [tag]);
      await client.query(
        `INSERT INTO hackathon_skills (hackathon_id, skill_id)
         SELECT $1, id FROM skills WHERE name = $2 ON CONFLICT DO NOTHING`,
        [id, tag]
      );
    }
    await client.query('COMMIT');
    return id;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Q1: personalised recommendations ranked by overlap, then soonest start.
async function recommendFor(userId, { upcomingOnly = true } = {}) {
  const r = await db.query(
    `SELECT h.id, h.title, h.link, h.start_date,
            COUNT(*)::int AS match_score,
            ARRAY_AGG(s.name ORDER BY s.name) AS matched_skills
     FROM user_skills us
     JOIN hackathon_skills hs ON hs.skill_id = us.skill_id
     JOIN hackathons h ON h.id = hs.hackathon_id
     JOIN skills s ON s.id = us.skill_id
     WHERE us.user_id = $1
       AND ($2::boolean = false OR h.start_date IS NULL OR h.start_date >= CURRENT_DATE)
     GROUP BY h.id
     ORDER BY match_score DESC, h.start_date ASC NULLS LAST`,
    [userId, upcomingOnly]
  );
  return r.rows;
}

// Q7: reverse lookup for organisers.
async function matchingUsers(hackathonId) {
  const r = await db.query(
    `SELECT u.id, u.name, u.email, COUNT(*)::int AS match_score
     FROM hackathon_skills hs
     JOIN user_skills us ON us.skill_id = hs.skill_id
     JOIN users u ON u.id = us.user_id
     WHERE hs.hackathon_id = $1
     GROUP BY u.id ORDER BY match_score DESC, u.name`,
    [hackathonId]
  );
  return r.rows;
}

// Q6
async function trendingSkills(limit = 10) {
  const r = await db.query(
    `SELECT s.name, COUNT(hs.hackathon_id)::int AS hackathon_count
     FROM skills s JOIN hackathon_skills hs ON hs.skill_id = s.id
     GROUP BY s.id ORDER BY hackathon_count DESC, s.name LIMIT $1`,
    [limit]
  );
  return r.rows;
}

async function allSkills() {
  const r = await db.query(`SELECT id, name FROM skills ORDER BY name`);
  return r.rows;
}

module.exports = {
  findAll, findById, upcoming, upsert, recommendFor, matchingUsers, trendingSkills, allSkills,
};
