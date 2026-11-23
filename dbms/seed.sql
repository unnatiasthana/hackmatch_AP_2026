-- Dummy students for the demo. Run once, after 03_schema.sql.
-- Dummy hackathons are in data/hackathons.json (npm run ingest).

INSERT INTO colleges (name) VALUES
    ('IIT Delhi'),
    ('IIT Bombay'),
    ('BITS Pilani');

INSERT INTO skills (name) VALUES
    ('gen ai'),
    ('python'),
    ('web3'),
    ('react'),
    ('node.js'),
    ('postgresql');

INSERT INTO users (name, email, college_id) VALUES
    ('Asha',  'asha@example.com', 1),
    ('Ravi',  'ravi@example.com', 1),
    ('Priya', 'priya@example.com', 2);

-- Asha: Gen AI, Python
INSERT INTO user_skills (user_id, skill_id)
SELECT u.id, s.id FROM users u, skills s
WHERE u.email = 'asha@example.com' AND s.name IN ('gen ai', 'python');

-- Ravi: Web3, React, Python
INSERT INTO user_skills (user_id, skill_id)
SELECT u.id, s.id FROM users u, skills s
WHERE u.email = 'ravi@example.com' AND s.name IN ('web3', 'react', 'python');

-- Priya: React, Node.js
INSERT INTO user_skills (user_id, skill_id)
SELECT u.id, s.id FROM users u, skills s
WHERE u.email = 'priya@example.com' AND s.name IN ('react', 'node.js');
