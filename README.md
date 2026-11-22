<h1 align="center">HackMatch</h1>

<p align="center">
  <strong>A data-driven recommendation directory to find your perfect hackathon.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
</p>

## 🚀 Overview

**HackMatch** is a data-driven recommendation directory built using Node.js and PostgreSQL. The platform automates data extraction from various hackathon platforms (like Unstop, Devpost) and uses a targeted matching engine to recommend the most relevant events to students based on their specific technical skills and interests.

## 💡 The Problem & Solution

* **Information Fragmentation:** Hackathons are scattered across dozens of different websites. Students interested in specific niches (e.g., "Gen AI" or "Web3") have to manually check multiple platforms. 
* **The Solution:** A centralized, automated directory that matches users to hackathons based on tag/skill overlap. No more endless searching—get personalized recommendations straight to your dashboard.

## 🛠️ Tech Stack

* **Frontend:** Vanilla HTML, CSS, JavaScript (Clean, minimal, light-themed, "Pinterest-style" aesthetic).
* **Backend:** Node.js, Express.js.
* **Database:** PostgreSQL (using `pg` library).


## 🗺️ Roadmap

### Phase 1: The Hackathon Discovery Engine (Current Focus)
1. **Data Ingestion:** A Node.js background cron job scrapes hackathon titles, dates, links, and tags from directories.
2. **Storage:** Cleaned data is saved into a PostgreSQL database.
3. **Matching Logic:** When a user logs in, the backend runs a SQL query comparing the user's saved skills with the hackathon tags, returning a personalized feed of recommended events.
4. **UI:** A simple dashboard where users select their skills and view matching hackathon cards.

### Phase 2: The Teammate Matchmaker (Future Scope)
* Users can post team requirements for specific hackathons.
* SQL-based matching to find students with *complementary* skills (e.g., a Backend Developer finding a UI Designer).

## 🗄️ Database Architecture (Phase 1 MVP)

### `users` Table
Stores student profiles and their selected skills.
* `id` (Primary Key, UUID)
* `name` (String)
* `email` (String, Unique)
* `college` (String)
* `skills` (Array of Strings)

### `hackathons` Table
Stores the scraped hackathon data.
* `id` (Primary Key, UUID)
* `title` (String)
* `link` (String, Unique)
* `start_date` (Date)
* `tags` (Array of Strings)

## 👨‍💻 Developers
**Unnati Asthana** - Group Leader / Developer
**Ankit Jakhar** - Developer / Contributor

## ▶️ Running the Project

Prerequisites: Node.js 22+, PostgreSQL 14+.

```bash
npm install
cp .env.example .env          # set DATABASE_URL
createdb hackmatch_db
psql hackmatch_db -f dbms/03_schema.sql   # schema + sample seed data
npm run dev                   # API + dashboard on http://localhost:3000
npm test
npm run ingest                # run the hackathon ingestion job once
```

Set `ENABLE_INGEST_CRON=true` to run ingestion on the `INGEST_CRON` schedule inside the API process.

## 🔌 API (all under `/api`)

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | Service status |
| GET / POST | `/users` | List users / create `{name, email, college}` |
| GET | `/users/:id` | Profile with skills (Q2) |
| POST | `/users/:id/skills` | Add skill `{skill}` (Q3) |
| DELETE | `/users/:id/skills/:skill` | Remove skill (Q9) |
| GET | `/users/:id/recommendations` | Ranked hackathon feed (Q1); `?include_past=true` |
| GET | `/users/leaderboard/colleges` | College leaderboard (Q10) |
| GET / POST | `/hackathons` | List (`?tag=`) / upsert `{title, link, start_date, tags}` (Q4, Q5) |
| GET | `/hackathons/upcoming?days=30` | Upcoming events (Q8) |
| GET | `/hackathons/:id` | One hackathon with tags |
| GET | `/hackathons/:id/matching-users` | Reverse lookup (Q7) |
| GET | `/skills`, `/skills/trending` | Skill list / trending skills (Q6) |

## 📁 Structure

`src/` (config, routes, controllers, models, services, jobs, middleware), `public/` (vanilla HTML/CSS/JS dashboard), `dbms/` (BCNF schema, queries, timings), `tests/`.

The API follows the normalized `dbms/` schema (`users`, `colleges`, `skills`, `user_skills`, `hackathons`, `hackathon_skills`) rather than the array columns sketched above. `server.js` and `scraper.js` are the original prototypes, now superseded by `src/`; `scraper.js` targets the older schema and its Devpost logic was ported to `src/services/ingest.service.js`.
