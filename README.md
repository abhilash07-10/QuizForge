# QuizForge

**Challenge Your Knowledge. Track Your Progress.**

QuizForge is a full-stack, multi-user practice-quiz and mock-test platform built with a Flask + PostgreSQL backend and a vanilla HTML/CSS/JS frontend. It includes real authentication, a timed quiz engine, honest server-calculated scoring, performance analytics, streaks, XP, achievements, and a leaderboard — all backed by real relational data, with no admin panel and no fake numbers.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, vanilla JavaScript (multi-page app) |
| Backend | Python 3, Flask, Flask-SQLAlchemy |
| Database | PostgreSQL (designed for Neon), SQLite fallback for local dev |
| Auth | JWT (stateless), password hashing via Werkzeug |
| Charts | Chart.js (loaded via CDN) |

---

## Project structure

```
QuizForge/
├── backend/
│   ├── app.py                 # Flask app factory + entrypoint
│   ├── config.py              # Environment-driven configuration
│   ├── requirements.txt
│   ├── seed.py                # Idempotent database seed script
│   ├── models/                # SQLAlchemy models
│   ├── routes/                # Blueprints (auth, quizzes, attempts, ...)
│   ├── services/               # Scoring, XP, streak, achievement logic
│   ├── seed_data/              # Question banks + category/quiz definitions
│   └── utils/                  # Auth decorators, validators, rate limiting
├── frontend/
│   ├── index.html, login.html, register.html, dashboard.html,
│   │   quizzes.html, quiz-detail.html, quiz.html, results.html,
│   │   analytics.html, leaderboard.html, profile.html, 404.html
│   ├── css/                    # Design tokens, base styles, components
│   ├── js/                     # API client, page logic, shared UI utilities
│   └── assets/
├── .env.example
├── Procfile                    # gunicorn start command (Render/Heroku-style)
├── render.yaml                 # Render.com blueprint
├── netlify.toml                # Netlify config for the static frontend
├── vercel.json                 # Vercel config alternative
└── README.md
```

---

## 1. Prerequisites

- Python 3.10+
- pip
- A free Neon account at neon.tech (for production/shared PostgreSQL) — optional for local dev, since the backend falls back to a local SQLite file if `DATABASE_URL` isn't set.

---

## 2. Local setup

### Clone and install backend dependencies

```bash
cd QuizForge/backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Configure environment variables

```bash
cd QuizForge
cp .env.example backend/.env
```

Open `backend/.env` and set:

```
SECRET_KEY=<generate one — see below>
FRONTEND_URL=http://localhost:5500
FLASK_ENV=development
```

Generate a secret key:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

For **local development**, you can leave `DATABASE_URL` unset — the backend will automatically use a local SQLite file at `backend/dev.db`. To use Neon locally too, follow the steps in section 3 and set `DATABASE_URL` in `backend/.env`.

### Initialize the database and seed data

```bash
cd backend
python seed.py
```

This creates all tables and inserts 11 categories, 22 quizzes, ~200 real questions, and the achievement definitions. It's **safe to run multiple times** — it won't create duplicates. To wipe and reseed quiz content from scratch:

```bash
python seed.py --reset
```

### Run the backend

```bash
python app.py
```

The API will be available at `http://localhost:5000`. Confirm it's running:

```bash
curl http://localhost:5000/api/health
```

### Run the frontend

The frontend is static HTML/CSS/JS — no build step required. Serve it with any static file server, for example:

```bash
cd QuizForge/frontend
python3 -m http.server 5500
```

Then open `http://localhost:5500/index.html` in your browser.

> **Important:** open `frontend/js/config.js` and confirm `QUIZFORGE_API_BASE` points at your backend (`http://localhost:5000/api` by default — this already matches the steps above).

---

## 3. Setting up Neon PostgreSQL (for production, or local Postgres testing)

1. Create a free account at neon.tech.
2. Create a new project (choose any region close to you).
3. In the Neon dashboard, open **Connection Details** and copy the connection string. It looks like:
   ```
   postgresql://username:password@ep-xxxx.neon.tech/dbname?sslmode=require
   ```
4. Paste it into `backend/.env` as `DATABASE_URL`.
5. Re-run the seed script against this database:
   ```bash
   cd backend
   python seed.py
   ```
6. Restart the backend (`python app.py`) — it will now read/write from Neon.

### Optional: local PostgreSQL instead of Neon

If you'd rather run Postgres locally during development:

```bash
# after installing PostgreSQL locally and creating a database named quizforge
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/quizforge
```

Set that in `backend/.env`, then run `python seed.py` as above. Neon remains the recommended path for anything you plan to deploy or share.

---

## 4. Production deployment

### Backend (Render)

1. Push this repo to GitHub.
2. In Render, choose **New +** → **Blueprint**, and point it at this repo (it will pick up `render.yaml`).
3. Set the `DATABASE_URL` env var to your Neon connection string, and `FRONTEND_URL` to your deployed frontend's URL (e.g. `https://quizforge.netlify.app`).
4. Render will run `pip install -r requirements.txt` and start the app with `gunicorn`, per `Procfile`/`render.yaml`.
5. After the first deploy, run the seed script once against production. The simplest way is to open a Render Shell for the service and run:
   ```bash
   cd backend && python seed.py
   ```

### Frontend (Netlify or Vercel)

1. Before deploying, edit `frontend/js/config.js` and set `QUIZFORGE_API_BASE` to your deployed backend URL, e.g.:
   ```js
   window.QUIZFORGE_API_BASE = 'https://quizforge-api.onrender.com/api';
   ```
2. **Netlify:** "Add new site" → "Import an existing project" → this repo. Netlify will read `netlify.toml` (base directory `frontend`) automatically.
3. **Vercel (alternative):** import the repo; `vercel.json` sets the output directory to `frontend`.
4. Once deployed, copy the frontend's live URL and set it as `FRONTEND_URL` on the Render backend service (comma-separate multiple origins if needed), then redeploy the backend so CORS allows it.

---

## 5. API overview

All endpoints are prefixed with `/api`. Protected endpoints require an `Authorization: Bearer <token>` header (obtained from `/auth/login` or `/auth/register`).

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | – | Create an account |
| POST | `/auth/login` | – | Log in |
| POST | `/auth/logout` | required | Log out (client discards token) |
| GET | `/auth/me` | required | Current user |
| GET | `/categories` | – | List categories |
| GET | `/quizzes` | – | List/search/filter quizzes |
| GET | `/quizzes/:id` | – | Quiz detail + rules |
| GET | `/quizzes/:id/questions` | required | Questions for taking a quiz (no answers) |
| POST | `/attempts` | required | Start an attempt |
| POST | `/attempts/:id/submit` | required | Submit answers, get scored |
| GET | `/attempts/:id` | required | Attempt summary |
| GET | `/attempts/:id/review` | required | Full answer review with explanations |
| GET | `/results` | required | Recent completed results |
| GET | `/progress` | required | Analytics data (charts, accuracy, streaks) |
| GET | `/leaderboard` | – | Weekly/monthly/all-time rankings |
| GET | `/achievements` | required | All achievements + unlock status |
| GET | `/profile` | required | Full profile |
| PUT | `/profile` | required | Update display name |

---

## 6. Notes

- There is intentionally **no admin panel or admin login**. Quiz content is managed entirely through `backend/seed_data/` and `seed.py` during development.
- Passwords are hashed (never stored or returned in plaintext); API responses never include `password_hash`.
- Scoring, XP, streaks, and achievements are all calculated server-side from real attempt data — nothing is hardcoded or faked on the frontend.
- The frontend never uses `alert()`, `confirm()`, or `prompt()` — all confirmations and notifications use the custom modal/toast components in `frontend/js/modal.js` and `frontend/js/toast.js`.
