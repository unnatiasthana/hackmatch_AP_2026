-- =============================================================
-- HackMatch Query Collection
-- =============================================================

-- -------------------------------------------------------------
-- Q1. Personalised hackathon recommendations for a given user
--     Returns hackathons ranked by number of matching skills,
--     then by soonest start date.
-- -------------------------------------------------------------
SELECT
    h.id,
    h.title,
    h.link,
    h.start_date,
    COUNT(*) AS match_score
FROM user_skills us
JOIN hackathon_skills hs ON hs.skill_id    = us.skill_id
JOIN hackathons       h  ON h.id           = hs.hackathon_id
WHERE us.user_id = $1          -- pass the selected student's UUID
  AND (h.start_date IS NULL OR h.start_date >= CURRENT_DATE)
GROUP BY h.id
ORDER BY match_score DESC, h.start_date ASC;

-- -------------------------------------------------------------
-- Q2. Full user profile (name, college, skills list)
-- -------------------------------------------------------------
SELECT
    u.id,
    u.name,
    u.email,
    c.name                          AS college,
    ARRAY_AGG(s.name ORDER BY s.name) AS skills
FROM users u
LEFT JOIN colleges    c  ON c.id = u.college_id
LEFT JOIN user_skills us ON us.user_id  = u.id
LEFT JOIN skills      s  ON s.id        = us.skill_id
WHERE u.id = $1
GROUP BY u.id, u.name, u.email, c.name;

-- -------------------------------------------------------------
-- Q3. Add a new skill to a user (upsert-safe)
-- -------------------------------------------------------------
-- Step 1: ensure the skill exists
INSERT INTO skills (name)
VALUES (lower(trim($1)))          -- $1 = raw skill name from form
ON CONFLICT (name) DO NOTHING;

-- Step 2: link user to skill
INSERT INTO user_skills (user_id, skill_id)
SELECT $2, id FROM skills WHERE name = lower(trim($1))
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------
-- Q4. Import a hackathon (upsert on link)
-- -------------------------------------------------------------
INSERT INTO hackathons (title, link, start_date)
VALUES ($1, $2, $3)
ON CONFLICT (link) DO UPDATE
    SET title      = EXCLUDED.title,
        start_date = EXCLUDED.start_date;

-- -------------------------------------------------------------
-- Q5. Tag a hackathon with a skill (upsert-safe)
-- -------------------------------------------------------------
INSERT INTO skills (name)
VALUES (lower(trim($1)))
ON CONFLICT (name) DO NOTHING;

INSERT INTO hackathon_skills (hackathon_id, skill_id)
SELECT $2, id FROM skills WHERE name = lower(trim($1))
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------
-- Q6. Top skills across all hackathons (for a trending widget)
-- -------------------------------------------------------------
SELECT
    s.name,
    COUNT(hs.hackathon_id) AS hackathon_count
FROM skills s
JOIN hackathon_skills hs ON hs.skill_id = s.id
GROUP BY s.id
ORDER BY hackathon_count DESC
LIMIT 10;

-- -------------------------------------------------------------
-- Q7. Users who match a specific hackathon (reverse lookup)
--     Useful for event organisers to see their target audience.
-- -------------------------------------------------------------
SELECT
    u.id,
    u.name,
    u.email,
    COUNT(*) AS match_score
FROM hackathon_skills hs
JOIN user_skills us ON us.skill_id = hs.skill_id
JOIN users       u  ON u.id        = us.user_id
WHERE hs.hackathon_id = $1
GROUP BY u.id
ORDER BY match_score DESC;

-- -------------------------------------------------------------
-- Q8. Upcoming hackathons in the next 30 days
-- -------------------------------------------------------------
SELECT h.*, ARRAY_AGG(s.name ORDER BY s.name) AS tags
FROM hackathons h
LEFT JOIN hackathon_skills hs ON hs.hackathon_id = h.id
LEFT JOIN skills           s  ON s.id            = hs.skill_id
WHERE h.start_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
GROUP BY h.id
ORDER BY h.start_date ASC;

-- -------------------------------------------------------------
-- Q9. Remove a skill from a user
-- -------------------------------------------------------------
DELETE FROM user_skills
WHERE user_id  = $1
  AND skill_id = (SELECT id FROM skills WHERE name = lower(trim($2)));

-- -------------------------------------------------------------
-- Q10. College leaderboard — most active colleges by user count
-- -------------------------------------------------------------
SELECT
    c.name  AS college,
    COUNT(u.id) AS user_count
FROM colleges c
LEFT JOIN users u ON u.college_id = c.id
GROUP BY c.id
ORDER BY user_count DESC;
