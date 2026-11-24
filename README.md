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

<p align="center">
  <strong>Live demo:</strong> <a href="https://hackmatch-ten.vercel.app">hackmatch-ten.vercel.app</a>
  <br />
  <sub>Hosted on Vercel with a free Neon PostgreSQL database. It uses dummy data and has no login.</sub>
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
* **Login:** bcryptjs (password hashing) and jsonwebtoken (JWT login tokens).


## 🗺️ Roadmap

### Phase 1: The Hackathon Discovery Engine (working)
1. **Data:** `npm run ingest` loads hackathons from `data/hackathons.json`. These are dummy events for the demo.
2. **Storage:** The data is saved in PostgreSQL.
3. **Matching:** A SQL query counts the skills shared by the student and each hackathon, and ranks by that count.
4. **UI:** Sign up, edit skills, see matches, add a hackathon, filter events, and view trending skills and top colleges.
5. **Login and roles:** Passwords are saved as bcrypt hashes. Logging in gives a JWT token. A student can change only their own skills, and only the admin can add hackathons.

### Demo logins

| Who | Email | Password |
| --- | --- | --- |
| Student | `asha@example.com`, `ravi@example.com`, `priya@example.com` | `demo1234` |
| Admin | `admin@example.com` | `admin123` |

Anyone can still view students and matches without logging in. These passwords are public demo passwords, so change them before real use.

### Not built yet
* **Safer logins:** no limit on wrong password tries, no "forgot password", and the token is kept in `localStorage`. A real app would add these.
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

## 👨‍💻 Developers
* **Unnati Asthana** - Group Leader / Developer
* **Ankit Jakhar** - Developer / Contributor
* **RudrakshBairagi**
* **Ankush Jha**

## ▶️ Running the Project

Prerequisites: Node.js 22+, PostgreSQL 14+. Start PostgreSQL first.

```bash
npm install
cp .env.example .env
createdb hackmatch_db
psql hackmatch_db -f dbms/03_schema.sql   # tables
psql hackmatch_db -f dbms/seed.sql        # dummy students and admin
npm run ingest                # load dummy hackathons
npm test                      # needs the database
npm run dev                   # API + dashboard on http://localhost:3000
```

Run the setup only once. After that, `npm run dev` is enough.

Already made the database before login was added? Run `psql hackmatch_db -f dbms/06_add_login.sql` once.
On the live site, set `JWT_SECRET` to a long random string.

If it says `password must be a string`, your Postgres wants a password. Either add it to `DATABASE_URL` in `.env`
(`postgresql://USER:PASSWORD@localhost:5432/hackmatch_db`) or, if plain `psql` works without one, use
`DATABASE_URL=postgresql:///hackmatch_db?host=/tmp` (Mac).

Set `ENABLE_INGEST_CRON=true` to run the import on the `INGEST_CRON` schedule.

## 🔌 API (all under `/api`)

🔒 = send `Authorization: Bearer <token>`. No token gives 401, a token without permission gives 403.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | Service status |
| POST | `/auth/login` | Log in `{email, password}`, returns `{token, user}` |
| GET | `/auth/me` | 🔒 The logged in user |
| GET / POST | `/users` | List students / sign up `{name, email, password, college}`, returns `{user, token}` |
| GET | `/users/:id` | Profile with skills, no email (Q2) |
| POST | `/users/:id/skills` | 🔒 Add skill `{skill}`, only your own (Q3) |
| DELETE | `/users/:id/skills/:skill` | 🔒 Remove skill, only your own (Q9) |
| GET | `/users/:id/recommendations` | Ranked hackathon feed (Q1); `?include_past=true` |
| GET | `/users/leaderboard/colleges` | College leaderboard (Q10) |
| GET / POST | `/hackathons` | List (`?tag=`) / 🔒 admin only: upsert `{title, link, start_date, tags}` (Q4, Q5) |
| GET | `/hackathons/upcoming?days=30` | Upcoming events (Q8) |
| GET | `/hackathons/:id` | One hackathon with tags |
| GET | `/hackathons/:id/matching-users` | Reverse lookup (Q7) |
| GET | `/skills`, `/skills/trending` | Skill list / trending skills (Q6) |

## 📁 Structure

* `public/tabs.js`: switch between pages
* `public/app.js`: student, skills and matches
* `public/login.js`: log in, log out, keep the token
* `public/explore.js`: all hackathons, filter, trending, colleges
* `public/signup.js`: signup form
* `public/event-form.js`: add hackathon form
* `src/routes/`: API addresses
* `src/controllers/`: check the input and send the response
* `src/middleware/auth.js`: login check (401) and permission checks (403)
* `src/models/`: SQL queries
* `src/services/`, `src/jobs/`: import hackathons
* `data/`: dummy hackathons
* `dbms/`: schema, seed, queries, timings
* `tests/`: API, login and matching tests
