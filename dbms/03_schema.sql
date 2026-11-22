-- =============================================================
-- HackMatch Database Schema (BCNF)
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
