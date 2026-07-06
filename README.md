# 🐱 CATOS — Cat Health Record Catalog

A full-stack cat health tracking app: real accounts, real per-cat records, an
LLM-powered behavior translator and photo health scanner (via Ollama), and
live nearby vet/shelter search (via Geoapify). Styled like a hand-kept index
card catalog.

## Features

- Email/password signup and login (JWT sessions)
- Multiple cat files per account, each with its own photo, records, and history
- Photo health scans analyzed by a vision LLM (Ollama), saved to the timeline
- Behavior translator that turns tags/notes into a plain-English reading (Ollama)
- Feeding schedule with reminders, vet visit records with document uploads,
  vaccination tracking
- Live "Vets & shelters" page using your real location and OpenStreetMap data
  (via Geoapify), with an interactive map
- Data export (JSON) and per-cat file deletion
- Fully responsive layout for phones, tablets, and desktop

All data is real and user-entered — there is no mock/demo data. Everything
you see was created through the UI and persisted on the server.

## Tech stack

**Frontend:** React 19, TypeScript, Vite 7, Tailwind CSS 4, Framer Motion,
React Router 7, Recharts, Leaflet/React-Leaflet, Lucide icons.

**Backend:** Node.js + Express 5, JWT auth (bcrypt + jsonwebtoken), Multer
for file uploads, a lightweight JSON-file datastore (no native DB
dependencies, so it runs anywhere without build tools).

**AI/data integrations:** Ollama (self-hosted LLM) for behavior translation
and photo analysis, Geoapify Places API for live vet/shelter search.

## Project structure

```
├── src/                  React frontend
├── server/
│   ├── index.js          Express app — all API routes
│   ├── db.js             JSON-file persistence layer
│   ├── auth.js           JWT signing/verification middleware
│   ├── llm.js            Ollama integration (behavior + scan analysis)
│   ├── places.js         Geoapify integration (nearby vets/shelters)
│   ├── data/db.json      Your persisted data (gitignored, created on first run)
│   └── uploads/          Uploaded photos & documents (gitignored)
├── .env.example          Copy to .env and fill in your keys
└── dist/                 Production build output (created by `npm run build`)
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env`:

```bash
copy .env.example .env
```

Then edit `.env`:

```env
PORT=4000
JWT_SECRET=replace_this_with_a_long_random_string

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_VISION_MODEL=llava

GEOAPIFY_API_KEY=
```

Generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

#### Setting up Ollama (LLM — behavior translator & photo scan)

CATOS calls a local or remote [Ollama](https://ollama.com) server for two
features: the Behavior page's plain-English translation, and the Scan
page's photo health read. **This is configured in `server/llm.js`** at the
top of the file, and via these `.env` values:

```env
OLLAMA_BASE_URL=http://localhost:11434   # or your remote Ollama host URL
OLLAMA_MODEL=llama3.2                    # text model, for Behavior
OLLAMA_VISION_MODEL=llava                # vision model, for Scan
```

Install Ollama, then pull the two models:

```bash
ollama pull llama3.2
ollama pull llava
```

If Ollama isn't running or isn't reachable, CATOS **automatically falls
back** to a built-in offline heuristic for both features, so the app (and a
hackathon demo) keeps working end-to-end even without Ollama configured. The
UI shows a small "offline heuristic" note on any result produced this way.

If you're hosting Ollama remotely (e.g. a cloud GPU box), just point
`OLLAMA_BASE_URL` at that server instead of localhost.

#### Setting up Geoapify (live vets & shelters)

The "Vets & shelters" page uses the [Geoapify Places API](https://www.geoapify.com/places-api/)
to find real nearby vets and animal shelters from OpenStreetMap data, based
on your browser's geolocation. **This is configured in `server/places.js`**,
via one `.env` value:

```env
GEOAPIFY_API_KEY=your_key_here
```

To get a free key (3,000 requests/day, no credit card required):

1. Go to [myprojects.geoapify.com](https://myprojects.geoapify.com/) and sign up
2. Create a project
3. Copy the API key from the API Keys section into `.env`

Without a key set, the Vets & Shelters page shows a clear on-screen message
telling you exactly what to add, instead of silently failing.

### 3. Run locally (development)

Run the frontend and backend together:

```bash
npm run dev:all
```

This starts:
- Vite dev server at **http://localhost:5173** (the app — open this)
- Express API server at **http://localhost:4000** (proxied automatically by Vite)

Or run them in separate terminals if you prefer:

```bash
npm run dev         # frontend, http://localhost:5173
npm run dev:server  # backend, http://localhost:4000
```

## Making it live (production)

CATOS ships as a single Express server that builds and serves the React
frontend itself — no separate static host needed.

### Run it yourself, on any server / VM

```bash
npm install
npm run build     # builds the frontend into dist/
npm run server    # or: npm start (build + serve in one step)
```

The app will be live at `http://<your-server>:4000` (or whatever `PORT` you
set in `.env`). Put this behind Nginx/Caddy with a TLS certificate for a real
public domain, or use a platform that handles TLS for you (see below).

### Deploying to a host

Any Node-hosting platform works since this is a normal Express app —
**Render**, **Railway**, **Fly.io**, or a VPS are the simplest options
(Vercel/Netlify are built for static sites + serverless functions, not a
long-running Express + file-upload server, so they're not the best fit here
unless you adapt the file storage to object storage).

**Render / Railway (recommended, simplest):**

1. Push this repo to GitHub
2. Create a new "Web Service" from your repo
3. Build command: `npm install && npm run build`
4. Start command: `npm run server`
5. Add your environment variables (`JWT_SECRET`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_VISION_MODEL`, `GEOAPIFY_API_KEY`) in the platform's dashboard
6. Deploy — you'll get a public HTTPS URL automatically

**Important:** the JSON-file datastore (`server/data/db.json`) and uploaded
photos (`server/uploads/`) live on local disk. Most hosting platforms reset
local disk on redeploy unless you attach a **persistent volume/disk** — do
that, or migrate `server/db.js` to a real database (Postgres, etc.) and
uploads to object storage (S3, R2, etc.) before relying on this for real
production data long-term.

**Ollama in production:** either run Ollama on the same machine as the
Express server (works fine on a VM/VPS with enough RAM), or run it on a
separate GPU box and point `OLLAMA_BASE_URL` at it.

## Security notes

- Set a real, random `JWT_SECRET` before deploying — the fallback dev value
  in the code is not secure.
- This app currently has no rate limiting or account lockout on
  login/signup. Add rate limiting (e.g. `express-rate-limit`) before
  exposing it publicly beyond a demo.
- Uploaded files are served directly from `/uploads` with no access
  control beyond requiring a login to *create* records — anyone with a
  direct file URL can view it. Fine for a demo; add signed URLs or an auth
  check on the static route for stricter production use.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Frontend dev server only |
| `npm run dev:server` | Backend dev server only (auto-restarts on changes) |
| `npm run dev:all` | Both, concurrently — use this for local development |
| `npm run build` | Build frontend for production into `dist/` |
| `npm run server` | Run the backend (serves `dist/` if it exists) |
| `npm start` | Build then run — one command for production |
| `npm run preview` | Preview the Vite production build without the API |

## License

Private project.
