-- Compares query speed with and without our indexes.
-- It adds 50,000 generated hackathons and rolls everything back at the end.
-- Use a separate database:
--   createdb hackmatch_bench
--   psql hackmatch_bench -f dbms/03_schema.sql
--   psql hackmatch_bench -f dbms/benchmark.sql

\set ON_ERROR_STOP on
BEGIN;

-- 2000 skills
INSERT INTO skills (name)
SELECT 'bench skill ' || n FROM generate_series(1, 2000) AS n;

-- 50000 hackathons, spread over past and future dates
INSERT INTO hackathons (title, link, start_date)
SELECT 'Event ' || n, 'https://example.com/bench/' || n, CURRENT_DATE - 1000 + (n % 3000)
FROM generate_series(1, 50000) AS n;

-- up to 3 skills for each hackathon
INSERT INTO hackathon_skills (hackathon_id, skill_id)
SELECT h.id, s.id
FROM generate_series(1, 50000) AS n
CROSS JOIN generate_series(1, 3) AS k
JOIN hackathons h ON h.link = 'https://example.com/bench/' || n
JOIN skills s ON s.name = 'bench skill ' || ((n * k) % 2000 + 1)
ON CONFLICT DO NOTHING;

-- one student with 5 skills
INSERT INTO users (name, email) VALUES ('Bench Student', 'bench@example.com')
RETURNING id AS student_id \gset

INSERT INTO user_skills (user_id, skill_id)
SELECT :'student_id', id FROM skills
WHERE name IN ('bench skill 11', 'bench skill 12', 'bench skill 13', 'bench skill 14', 'bench skill 15');

ANALYZE;

-- same as Q1 in 04_queries.sql
PREPARE q1(uuid) AS
SELECT h.id, h.title, h.link, h.start_date, COUNT(*) AS match_score
FROM user_skills us
JOIN hackathon_skills hs ON hs.skill_id = us.skill_id
JOIN hackathons h ON h.id = hs.hackathon_id
WHERE us.user_id = $1
  AND (h.start_date IS NULL OR h.start_date >= CURRENT_DATE)
GROUP BY h.id
ORDER BY match_score DESC, h.start_date ASC;

-- same as Q6
PREPARE q6 AS
SELECT s.name, COUNT(hs.hackathon_id) AS hackathon_count
FROM skills s
JOIN hackathon_skills hs ON hs.skill_id = s.id
GROUP BY s.id
ORDER BY hackathon_count DESC
LIMIT 10;

-- same as Q8
PREPARE q8 AS
SELECT h.*, ARRAY_AGG(s.name ORDER BY s.name) AS tags
FROM hackathons h
LEFT JOIN hackathon_skills hs ON hs.hackathon_id = h.id
LEFT JOIN skills s ON s.id = hs.skill_id
WHERE h.start_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
GROUP BY h.id
ORDER BY h.start_date ASC;

\echo '=== Q1 with indexes'
EXPLAIN (ANALYZE, BUFFERS) EXECUTE q1(:'student_id');
\echo '=== Q6 with indexes'
EXPLAIN (ANALYZE, BUFFERS) EXECUTE q6;
\echo '=== Q8 with indexes'
EXPLAIN (ANALYZE, BUFFERS) EXECUTE q8;

DROP INDEX idx_hackathon_skills_skill_id, idx_user_skills_skill_id, idx_hackathons_start_date;

\echo '=== Q1 without indexes'
EXPLAIN (ANALYZE, BUFFERS) EXECUTE q1(:'student_id');
\echo '=== Q6 without indexes'
EXPLAIN (ANALYZE, BUFFERS) EXECUTE q6;
\echo '=== Q8 without indexes'
EXPLAIN (ANALYZE, BUFFERS) EXECUTE q8;

-- puts the indexes back and removes the test rows
ROLLBACK;
