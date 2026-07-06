# Architecture Notes

## Data model (conceptual)

```
User
└── Cats[]
    ├── profile (name, breed, birthdate, sex, weight, photo)
    ├── FeedingSchedule[]
    ├── VetVisits[] (+ uploaded documents)
    ├── Vaccinations[]
    └── Timeline[] (scans, behavior readings, visits, feedings — merged, sorted)
```

## Persistence

- `server/db.js` wraps a single `server/data/db.json` file with read/write
  helpers. This avoids any native DB driver so the project runs on any
  machine with just Node installed — good for hackathon judging/demos and
  quick self-hosting.
- Every write is a full read-modify-write of the JSON file. This is fine at
  small/demo scale; for real multi-user production traffic, swap this
  module for a real database (Postgres via Prisma/Knex is the natural next
  step) without touching route handlers, since `db.js` exposes plain
  functions (`getUser`, `saveCat`, etc.) that routes call — only the
  internals need to change.
- Uploaded files (`server/uploads/`) are referenced by path in `db.json`.
  Moving to S3/R2 means swapping Multer's disk storage engine for an S3
  storage engine and storing the returned URL instead of a local path.

## Auth flow

1. `POST /api/auth/signup` hashes the password with bcrypt and stores the
   user record.
2. Both signup and login return a JWT signed with `JWT_SECRET`, containing
   the user id and an expiry.
3. `server/auth.js` exposes an Express middleware that verifies the
   `Authorization: Bearer <jwt>` header on protected routes and attaches
   `req.user`.
4. The frontend stores the JWT (e.g. in memory/localStorage) and attaches it
   to every API request.

## AI integration & fallback strategy

`server/llm.js` centralizes all Ollama calls:

- `translateBehavior(tags, notes)` → calls `OLLAMA_MODEL` via the
  `/api/generate` (or `/api/chat`) endpoint on `OLLAMA_BASE_URL`.
- `analyzePhoto(imageBuffer)` → calls `OLLAMA_VISION_MODEL` with the image
  base64-encoded.

Both functions wrap the network call in a try/catch. On any failure
(connection refused, timeout, non-2xx, malformed response), they fall back
to a deterministic **offline heuristic** (simple keyword/rule-based logic)
so the corresponding API route *never* hard-fails just because Ollama is
unavailable. The response always includes a `source` field (`"ollama"` or
`"heuristic"`) so the frontend can render a small transparency badge.

This means:

- Local dev without Ollama installed → app still fully functional.
- Demo on a machine/judge's laptop with no GPU → app still fully functional.
- Production with Ollama configured → real LLM-backed results.

## Places integration

`server/places.js` is a thin proxy to the Geoapify Places API. The API key
never leaves the server. If `GEOAPIFY_API_KEY` is unset, the route returns a
`503` with a message the frontend renders directly, instead of silently
returning empty results — this was a deliberate choice to avoid confusing
"why is this page empty" bugs in the field.

## Frontend/backend boundary in production

`npm run build` outputs static assets to `dist/`. `npm run server`
(`server/index.js`) serves that folder directly via `express.static` and
falls back to `index.html` for client-side routing, while also exposing
`/api/*`. This means production is **one process, one port** — simplifying
deployment to a single Node service on Render/Railway/a VPS.
