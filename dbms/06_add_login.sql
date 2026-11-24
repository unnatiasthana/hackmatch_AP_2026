-- Run this once on a database made before login was added.
-- New databases don't need it, 03_schema.sql and seed.sql already have everything.

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student';

-- old students get the demo password demo1234
UPDATE users
SET password_hash = '$2b$10$FBPJok/Ur70fAEBWwGwAa.rn5iL7rVnauW2VLZAl5fDx3dx9wRZeq'
WHERE password_hash IS NULL;

ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'admin'));

-- the admin account, password admin123
INSERT INTO users (name, email, password_hash, role)
VALUES ('Admin', 'admin@example.com', '$2b$10$gRTazJ/o8V4XYuYjYQhxBeUCgbLdxfvutY6UQP6gWf2J8eRW4dTw.', 'admin')
ON CONFLICT (email) DO NOTHING;
