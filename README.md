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

**HackMatch** is a data-driven recommendation directory built using Node.js and PostgreSQL. The platform imports hackathons from a JSON file (dummy demo data for now) and uses a targeted matching engine to recommend the most relevant events to students based on their specific technical skills and interests.

## 💡 The Problem & Solution

* **Information Fragmentation:** Hackathons are scattered across dozens of different websites. Students interested in specific niches (e.g., "Gen AI" or "Web3") have to manually check multiple platforms. 
* **The Solution:** One directory that matches students to hackathons by skill overlap and shows the best matches first.

## 🛠️ Tech Stack

* **Frontend:** Vanilla HTML, CSS, JavaScript (simple tabs, ranked list of matches).
* **Backend:** Node.js, Express.js.
* **Database:** PostgreSQL (using `pg` library).


## 🗺️ Roadmap

### Phase 1: The Hackathon Discovery Engine (working)
1. **Data:** `npm run ingest` loads hackathons from `data/hackathons.json`. These are dummy events for the demo.
2. **Storage:** The data is saved in PostgreSQL.
3. **Matching:** A SQL query counts the skills shared by the student and each hackathon, and ranks by that count.
4. **UI:** Sign up, edit skills, see matches, add a hackathon, filter events, and view trending skills and top colleges.

### Not built yet
* **Login:** You pick a student from a list, so anyone using the app can edit any student. Do not host it publicly like this.
* **Live data from other websites:** [Devpost's terms](https://info.devpost.com/legal/devpost/terms-of-service) don't allow scraping, so we import from a file.

### Phase 2: The Teammate Matchmaker (Future Scope)
* Users can post team requirements for specific hackathons.
* SQL-based matching to find students with *complementary* skills (e.g., a Backend Developer finding a UI Designer).

## 🗄️ Database

| Table | What it stores |
| --- | --- |
| `colleges` | college names |
| `users` | name, email, college |
| `skills` | skill names |
| `user_skills` | which student has which skill |
| `hackathons` | title, link, start date |
| `hackathon_skills` | which hackathon needs which skill |

See the [ER diagram](dbms/02_er_diagram.md) and [normalization](dbms/01_normalization.md).

## 👨‍💻 Team
* **Unnati Asthana** - Group Leader / Developer
* **RudrakshBairagi**
* **Ankush Jha**

## ▶️ Running the Project

Prerequisites: Node.js 22+, PostgreSQL 14+. Start PostgreSQL first.

```bash
npm install
cp .env.example .env
createdb hackmatch_db
psql hackmatch_db -f dbms/03_schema.sql   # tables
psql hackmatch_db -f dbms/seed.sql        # dummy students
npm run ingest                # load dummy hackathons
npm test                      # needs the database
npm run dev                   # API + dashboard on http://localhost:3000
```

Run the setup only once. After that, `npm run dev` is enough.

If it says `password must be a string`, your Postgres wants a password. Either add it to `DATABASE_URL` in `.env`
(`postgresql://USER:PASSWORD@localhost:5432/hackmatch_db`) or, if plain `psql` works without one, use
`DATABASE_URL=postgresql:///hackmatch_db?host=/tmp` (Mac).

Set `ENABLE_INGEST_CRON=true` to run the import on the `INGEST_CRON` schedule.

## 🔌 API (all under `/api`)

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | Service status |
| GET / POST | `/users` | List users / create `{name, email, college}` |
| GET | `/users/:id` | Profile with skills, no email (Q2) |
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

* `public/tabs.js`: switch between pages
* `public/app.js`: student, skills and matches
* `public/explore.js`: all hackathons, filter, trending, colleges
* `public/signup.js`: signup form
* `public/event-form.js`: add hackathon form
* `src/routes/`: API addresses
* `src/controllers/`: check the input and send the response
* `src/models/`: SQL queries
* `src/services/`, `src/jobs/`: import hackathons
* `data/`: dummy hackathons
* `dbms/`: schema, seed, queries, timings
* `tests/`: API and matching tests
