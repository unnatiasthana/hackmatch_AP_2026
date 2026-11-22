-- =============================================================
-- HackMatch Database Schema (BCNF)
-- Normalized to BCNF — see dbms/01_normalization.md for the
-- formal UNF → 1NF → 2NF → 3NF → BCNF decomposition proof.
-- =============================================================

-- colleges: lookup table so college names are stored once
CREATE TABLE colleges (
    id   SERIAL PRIMARY KEY,
    name TEXT   UNIQUE NOT NULL
);

-- users: student profiles
CREATE TABLE users (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    email      TEXT UNIQUE NOT NULL,
    college_id INT  REFERENCES colleges(id)
);

-- skills: canonical skill/tag names (lowercase, trimmed)
CREATE TABLE skills (
    id   SERIAL PRIMARY KEY,
    name TEXT   UNIQUE NOT NULL
);

-- user_skills: many-to-many between users and skills
CREATE TABLE user_skills (
    user_id  UUID REFERENCES users(id)  ON DELETE CASCADE,
    skill_id INT  REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, skill_id)
);

-- hackathons: scraped hackathon data
CREATE TABLE hackathons (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title      TEXT NOT NULL,
    link       TEXT UNIQUE NOT NULL,
    start_date DATE
);

-- hackathon_skills: many-to-many between hackathons and skills
CREATE TABLE hackathon_skills (
    hackathon_id UUID REFERENCES hackathons(id) ON DELETE CASCADE,
    skill_id     INT  REFERENCES skills(id)      ON DELETE CASCADE,
    PRIMARY KEY (hackathon_id, skill_id)
);

-- =============================================================
-- Indexes for fast matching queries
-- =============================================================

-- Speed up skill lookups by name (used by the scraper normaliser)
CREATE INDEX idx_skills_name ON skills(name);

-- Speed up "which hackathons match this user" join
CREATE INDEX idx_hackathon_skills_skill_id ON hackathon_skills(skill_id);

-- Speed up "which skills does this user have" join
CREATE INDEX idx_user_skills_skill_id ON user_skills(skill_id);

-- Speed up filtering hackathons by start date
CREATE INDEX idx_hackathons_start_date ON hackathons(start_date);

-- =============================================================
-- Sample seed data
-- =============================================================

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

INSERT INTO hackathons (title, link, start_date) VALUES
    ('AI Sprint',   'https://unstop.com/ai-sprint',         '2026-12-05'),
    ('ChainFest',   'https://devpost.com/chainfest',        '2026-12-12'),
    ('PyCon Hack',  'https://devpost.com/pyconhack',        '2026-12-20');

-- AI Sprint: Gen AI, Python
INSERT INTO hackathon_skills (hackathon_id, skill_id)
SELECT h.id, s.id FROM hackathons h, skills s
WHERE h.link = 'https://unstop.com/ai-sprint' AND s.name IN ('gen ai', 'python');

-- ChainFest: Web3
INSERT INTO hackathon_skills (hackathon_id, skill_id)
SELECT h.id, s.id FROM hackathons h, skills s
WHERE h.link = 'https://devpost.com/chainfest' AND s.name IN ('web3');

-- PyCon Hack: Python, Node.js
INSERT INTO hackathon_skills (hackathon_id, skill_id)
SELECT h.id, s.id FROM hackathons h, skills s
WHERE h.link = 'https://devpost.com/pyconhack' AND s.name IN ('python', 'node.js');
