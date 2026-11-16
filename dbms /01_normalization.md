# Normalization of the HackMatch database

HackMatch stores two main things: students (with their skills) and hackathons (with tags). This file shows how we got from a simple first design with arrays to a cleaner schema in BCNF, and why we made each change.

## The entities

- **users**: name, email, college
- **hackathons**: title, link, start date
- **skills**: things like Gen AI, Web3, React, Python
- users have many skills, and hackathons have many tags (which are the same skills)

## Starting point (UNF)

Our first idea was to keep it simple, one row per user and one row per hackathon, with the skills and tags stored as arrays.

```text
users(user_id, name, email, college, skills[])
hackathons(hackathon_id, title, link, start_date, tags[])
```

Some sample rows:

| user_id | name | email | college | skills |
| :--- | :--- | :--- | :--- | :--- |
| usr_01 | Asha | asha@example.com | IIT Delhi | Gen AI, Python |
| usr_02 | Ravi | ravi@example.com | iit delhi | Web3, React, Python |

| hackathon_id | title | link | start_date | tags |
| :--- | :--- | :--- | :--- | :--- |
| hk_01 | AI Sprint | unstop.com/ai-sprint | 2026-12-05 | Gen AI, Python |
| hk_02 | ChainFest | devpost.com/chainfest | 2026-12-12 | Web3 |

What's wrong with this:

- `skills` and `tags` hold several values in one cell, so they aren't atomic.
- Matching a user to hackathons means comparing arrays, which is awkward and hard to index.
- Nothing stops "IIT Delhi" and "iit delhi" (see the table above) from being treated as two different colleges. The same can happen with "GenAI" and "Gen AI".

## 1NF

To get to 1NF every cell has to hold one value, so we put each skill and each tag on its own row.

```text
user_skills_flat(user_id, name, email, college, skill)
hackathon_tags_flat(hackathon_id, title, link, start_date, tag)
```

| user_id | name | email | college | skill |
| :--- | :--- | :--- | :--- | :--- |
| usr_01 | Asha | asha@example.com | IIT Delhi | Gen AI |
| usr_01 | Asha | asha@example.com | IIT Delhi | Python |
| usr_02 | Ravi | ravi@example.com | iit delhi | Web3 |
| usr_02 | Ravi | ravi@example.com | iit delhi | React |
| usr_02 | Ravi | ravi@example.com | iit delhi | Python |

Keys: `(user_id, skill)` for the first table and `(hackathon_id, tag)` for the second.

Dependencies:
- user_id → name, email, college
- hackathon_id → title, link, start_date
- email and link are also unique

This fixes atomicity but creates new problems, because user details are now repeated on every skill row:

- Insert: you can't add a user who hasn't picked a skill yet, or a hackathon with no tags.
- Update: changing a user's college means editing every one of their rows.
- Delete: if a user removes their only skill, their whole profile disappears.

## 2NF

2NF means no non-key column should depend on only part of a composite key. In both tables above that is exactly what happens: `name`, `email` and `college` depend only on `user_id`, and `title`, `link` and `start_date` depend only on `hackathon_id`.

So we split each table in two:

- `users(user_id, name, email, college)`
- `user_skills(user_id, skill)`
- `hackathons(hackathon_id, title, link, start_date)`
- `hackathon_tags(hackathon_id, tag)`

The two link tables only have key columns, so there is nothing left to depend partially.

What is still not great is that skills, tags and colleges are plain text. Typos and different spellings can still sneak in.

## 3NF

Every table is technically already in 3NF, since every determinant is a key and there are no non-key columns depending on other non-key columns. We still made two changes because of the text problem above.

**Skills table.** User skills and hackathon tags are the same kind of thing, so they share one `skills` table, and both link tables point to it. Matching then becomes a join on `skill_id` instead of comparing strings.

```text
skills(id, name UNIQUE)
user_skills(user_id, skill_id)
hackathon_skills(hackathon_id, skill_id)
```

**Colleges table.** `college` doesn't have any attributes of its own right now, so this isn't required by the 3NF definition. We did it anyway so each college is stored once, which avoids duplicates like the IIT Delhi example and lets us query by college later.

```text
colleges(id, name UNIQUE)
users(id, name, email UNIQUE, college_id)
```

## BCNF

BCNF needs every determinant to be a superkey. Going through each table:

| Table | Candidate keys | Determinants | BCNF? |
| :--- | :--- | :--- | :--- |
| users | id, email | id, email | yes |
| colleges | id, name | id, name | yes |
| skills | id, name | id, name | yes |
| user_skills | (user_id, skill_id) | the full key only | yes |
| hackathons | id, link | id, link | yes |
| hackathon_skills | (hackathon_id, skill_id) | the full key only | yes |

None of them break the rule, so no further splitting is needed.

## Final schema

```sql
CREATE TABLE colleges (
    id   SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE users (
    id         UUID PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT UNIQUE NOT NULL,
    college_id INT REFERENCES colleges(id)
);

CREATE TABLE skills (
    id   SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE user_skills (
    user_id  UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_id INT  REFERENCES skills(id),
    PRIMARY KEY (user_id, skill_id)
);

CREATE TABLE hackathons (
    id         UUID PRIMARY KEY,
    title      TEXT NOT NULL,
    link       TEXT UNIQUE NOT NULL,
    start_date DATE
);

CREATE TABLE hackathon_skills (
    hackathon_id UUID REFERENCES hackathons(id) ON DELETE CASCADE,
    skill_id     INT  REFERENCES skills(id),
    PRIMARY KEY (hackathon_id, skill_id)
);
```

The recommendation query for a user now looks like this:

```sql
SELECT h.*, COUNT(*) AS match_score
FROM user_skills us
JOIN hackathon_skills hs ON hs.skill_id = us.skill_id
JOIN hackathons h        ON h.id = hs.hackathon_id
WHERE us.user_id = $1
GROUP BY h.id
ORDER BY match_score DESC, h.start_date ASC;
```

## Summary

| Form | What it fixed | What we did |
| :--- | :--- | :--- |
| UNF | nothing yet | arrays for skills and tags |
| 1NF | non-atomic values | one row per skill / tag |
| 2NF | partial dependencies | split users and hackathons from their link tables |
| 3NF | repeated text values | added `skills` and `colleges` tables |
| BCNF | checked every determinant | no changes needed |

## A few notes

- Postgres could handle this with `TEXT[]` and a GIN index, and that would probably be fast enough at our size. We chose junction tables because they keep skills consistent, support foreign keys, and will be needed for Phase 2 (matching teammates with complementary skills).
- The scraper should lowercase and trim tags and map them to an existing skill row before inserting, otherwise the skills table fills up with near-duplicates.
- We use UUIDs for `users` and `hackathons` so references don't break if an email or link changes. `email` and `link` stay unique, which also helps avoid duplicate scrapes.
