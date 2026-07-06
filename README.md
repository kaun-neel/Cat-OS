<p align="center">
  <img src="public/images/logo.png" alt="CATOS logo" width="220">
</p>

<h1 align="center">Cat-OS</h1>

<p align="center">Made with 🐾 for cats</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black&style=for-the-badge">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=for-the-badge">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white&style=for-the-badge">
  <img alt="TailwindCSS" src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white&style=for-the-badge">
  <img alt="Node" src="https://img.shields.io/badge/Node.js-Express_5-339933?logo=node.js&logoColor=white&style=for-the-badge">
  <img alt="Ollama" src="https://img.shields.io/badge/Ollama-LLM-000000?logo=ollama&logoColor=white&style=for-the-badge">
  <img alt="License" src="https://img.shields.io/badge/License-Private-lightgrey?style=for-the-badge">
</p>

<p align="center">
  Real accounts. Real per-cat records. An LLM-powered behavior translator and photo health<br/>
  scanner. Live nearby vet &amp; shelter search. No mock data — everything you see is user-entered.
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-configuration">Configuration</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-api-reference">API</a> •
  <a href="#-security">Security</a>
</p>

---

## 🗂️ Overview

**CATOS** (Cat Health Record Catalog) is a full-stack web application that turns cat
healthcare tracking into a beautifully styled, index-card-catalog-inspired experience.
Every cat gets its own "file" — photo, feeding schedule, vet visits, vaccinations, and a
running timeline — backed by a real account and real persisted data.

On top of the record-keeping basics, CATOS layers in two AI-assisted features (behavior
translation and photo health scanning via a self-hosted **Ollama** LLM) and a live map of
nearby vets and shelters powered by **Geoapify** + OpenStreetMap. Both integrations degrade
gracefully — the app works fully offline/demo-ready even without either configured.

> 💡 **No mock data, ever.** Everything rendered in the UI was created by a real user
> through the real UI, and persisted server-side.

---

## ✨ Features

| | |
|---|---|
| 🔐 **Accounts** | Email/password signup & login secured with bcrypt + JWT sessions |
| 🐈 **Multi-cat files** | Unlimited cats per account, each with its own photo, history, and records |
| 📸 **AI photo scan** | Upload a photo → vision LLM (Ollama/LLaVA) analyzes visible health cues, saved to the cat's timeline |
| 🗣️ **Behavior translator** | Turn behavior tags/notes into a plain-English read on what your cat might be feeling |
| 🍽️ **Feeding schedule** | Set feeding times with reminders |
| 🏥 **Vet visit records** | Log visits with attached documents (Multer file uploads) |
| 💉 **Vaccination tracking** | Keep a running vaccine history per cat |
| 🗺️ **Vets & shelters** | Live, location-aware search of nearby vets/shelters on an interactive Leaflet map (Geoapify + OSM data) |
| 📤 **Data export** | Export all your data as JSON, anytime |
| 🗑️ **Full control** | Delete any cat file and its records permanently |
| 📱 **Responsive** | Looks and works great on phone, tablet, and desktop |
| 🔌 **Graceful degradation** | No Ollama? No Geoapify key? The app still works, with clear on-screen fallbacks |

---

## 🧱 Tech Stack

**Frontend**
React 19 · TypeScript · Vite 7 · Tailwind CSS 4 · Framer Motion · React Router 7 · Recharts · Leaflet / React-Leaflet · Lucide Icons

**Backend**
Node.js · Express 5 · JWT auth (bcrypt + jsonwebtoken) · Multer (file uploads) · lightweight JSON-file datastore (zero native DB dependencies — runs anywhere, no build tools required)

**AI / Data Integrations**
[Ollama](https://ollama.com) (self-hosted LLM) for behavior translation & photo analysis · [Geoapify Places API](https://www.geoapify.com/places-api/) for live vet/shelter search

---

## 🏗️ Architecture

```
┌────────────────────┐        HTTPS / REST         ┌──────────────────────────┐
│   React SPA (Vite)  │ ───────────────────────────▶│      Express 5 API       │
│  Tailwind, Framer,  │◀─────────────────────────── │  JWT auth · Multer       │
│  Leaflet, Recharts   │        JSON responses       │  server/index.js         │
└────────────────────┘                              └────────┬─────────────────┘
                                                              │
                          ┌───────────────────────────────────┼───────────────────────────┐
                          ▼                                   ▼                           ▼
                ┌──────────────────┐               ┌──────────────────┐        ┌──────────────────┐
                │  db.json          │               │  Ollama server    │        │  Geoapify Places  │
                │  (JSON datastore) │               │  llama3.2 / llava │        │  API (OSM data)    │
                │  + /uploads       │               │  (local or remote)│        │                    │
                └──────────────────┘               └──────────────────┘        └──────────────────┘
```

- The **frontend and backend ship as one app** in production — Express serves the built
  Vite bundle (`dist/`) and exposes the API from the same origin.
- The **datastore is a single JSON file** (`server/data/db.json`) — intentionally simple
  so the project runs anywhere with zero native build dependencies. Swap in Postgres/Mongo
  later without touching the rest of the stack (see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)).
- **AI and maps are optional add-ons.** Both are called from the backend so API keys never
  reach the browser, and both have offline fallbacks.

## 📁 Project Structure

```
├── src/                  React frontend
│   ├── components/       UI components (cards, forms, map, charts…)
│   ├── pages/             Route-level pages
│   └── ...
├── server/
│   ├── index.js          Express app — all API routes
│   ├── db.js             JSON-file persistence layer
│   ├── auth.js           JWT signing/verification middleware
│   ├── llm.js            Ollama integration (behavior + scan analysis)
│   ├── places.js         Geoapify integration (nearby vets/shelters)
│   ├── data/db.json      Your persisted data (gitignored, created on first run)
│   └── uploads/          Uploaded photos & documents (gitignored)
├── assets/                Logo & README images
├── docs/                  Extra documentation (API reference, architecture)
├── .env.example           Copy to .env and fill in your keys
└── dist/                  Production build output (created by `npm run build`)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- *(Optional)* [Ollama](https://ollama.com) installed locally or reachable remotely
- *(Optional)* A free [Geoapify](https://myprojects.geoapify.com/) API key

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
copy .env.example .env      # Windows
# cp .env.example .env      # macOS/Linux
```

Edit `.env`:

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

### 3. Run it locally

```bash
npm run dev:all
```

| URL | What |
|---|---|
| `http://localhost:5173` | React app (open this) |
| `http://localhost:4000` | Express API (proxied automatically by Vite) |

Or run each side separately:

```bash
npm run dev         # frontend only
npm run dev:server  # backend only, auto-restarts on changes
```

---

## ⚙️ Configuration

### 🤖 Ollama — behavior translator & photo scan

CATOS calls a local or remote Ollama server for two features: the **Behavior** page's
plain-English translation, and the **Scan** page's photo health read. Configured in
`server/llm.js` plus these `.env` values:

```env
OLLAMA_BASE_URL=http://localhost:11434   # or your remote Ollama host URL
OLLAMA_MODEL=llama3.2                    # text model, for Behavior
OLLAMA_VISION_MODEL=llava                # vision model, for Scan
```

Install Ollama and pull the models:

```bash
ollama pull llama3.2
ollama pull llava
```

> If Ollama isn't running or reachable, CATOS **automatically falls back** to a built-in
> offline heuristic for both features — the app (and a live demo) keeps working end-to-end
> even with zero AI configured. The UI marks any such result with an *"offline heuristic"*
> badge, so it's always transparent about how a result was produced.

Hosting Ollama on a separate GPU box? Just point `OLLAMA_BASE_URL` at it.

### 📍 Geoapify — live vets & shelters

The **Vets & Shelters** page uses the [Geoapify Places API](https://www.geoapify.com/places-api/)
to surface real nearby vets and animal shelters from OpenStreetMap data, based on your
browser's geolocation. Configured in `server/places.js` via:

```env
GEOAPIFY_API_KEY=your_key_here
```

Get a free key (3,000 requests/day, no credit card):

1. Sign up at [myprojects.geoapify.com](https://myprojects.geoapify.com/)
2. Create a project
3. Copy the API key into `.env`

> Without a key, the page shows a clear on-screen message telling the user exactly what to
> add — no silent failures.

---

## 📦 Scripts

| Script | Description |
|---|---|
| `npm run dev` | Frontend dev server only |
| `npm run dev:server` | Backend dev server only (auto-restarts on changes) |
| `npm run dev:all` | Both, concurrently — use this for local development |
| `npm run build` | Build frontend for production into `dist/` |
| `npm run server` | Run the backend (serves `dist/` if it exists) |
| `npm start` | Build then run — one command for production |
| `npm run preview` | Preview the Vite production build without the API |

---

## ☁️ Deployment

CATOS ships as a **single Express server** that builds and serves the React frontend
itself — no separate static host needed.

### Run it yourself, on any server / VM

```bash
npm install
npm run build     # builds the frontend into dist/
npm run server    # or: npm start (build + serve in one step)
```

The app will be live at `http://<your-server>:4000` (or whatever `PORT` you set). Put this
behind Nginx/Caddy with a TLS certificate for a public domain, or use a platform that
handles TLS for you.
