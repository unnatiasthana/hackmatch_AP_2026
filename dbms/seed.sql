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

-- Demo passwords: students = demo1234, admin = admin123
-- These are bcrypt hashes. Same password, different hash, because of the salt.
INSERT INTO users (name, email, college_id, password_hash, role) VALUES
    ('Asha',  'asha@example.com',  1, '$2b$10$FBPJok/Ur70fAEBWwGwAa.rn5iL7rVnauW2VLZAl5fDx3dx9wRZeq', 'student'),
    ('Ravi',  'ravi@example.com',  1, '$2b$10$1fgw2utslZ6hCP6.h9DtW.XvvkmWlViUtLe1sqQ1x2abrrg4lNChC', 'student'),
    ('Priya', 'priya@example.com', 2, '$2b$10$3JxRE41z5HBRsVlkXosDn.2DY3r/NTFEMII29Ypf5ZAvr/V8GY5Su', 'student'),
    ('Admin', 'admin@example.com', NULL, '$2b$10$gRTazJ/o8V4XYuYjYQhxBeUCgbLdxfvutY6UQP6gWf2J8eRW4dTw.', 'admin');

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
