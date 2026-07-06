# API Reference

Base URL (dev): `http://localhost:4000/api`
Base URL (prod): `https://<your-domain>/api`

All authenticated routes expect a header:

```
Authorization: Bearer <jwt>
```

Errors are returned as:

```json
{ "error": "human-readable message" }
```

---

## Auth

### `POST /api/auth/signup`

Create a new account.

**Body**

```json
{ "email": "user@example.com", "password": "min-8-chars", "name": "Jane" }
```

**Response `201`**

```json
{ "token": "<jwt>", "user": { "id": "...", "email": "...", "name": "..." } }
```

### `POST /api/auth/login`

**Body**

```json
{ "email": "user@example.com", "password": "..." }
```

**Response `200`** — same shape as signup.

### `GET /api/auth/me`

Returns the current authenticated user. Requires `Authorization` header.

---

## Cats

### `GET /api/cats`

List all cats belonging to the authenticated user.

### `POST /api/cats`

Create a new cat file. `multipart/form-data` if a photo is included.

**Body (form fields)**

```
name, breed, birthdate, sex, weight, photo (file, optional)
```

### `GET /api/cats/:id`

Fetch a single cat file with its full record set.

### `PATCH /api/cats/:id`

Update cat details (partial update).

### `DELETE /api/cats/:id`

Permanently deletes the cat and all associated records/uploads.

---

## Records

### `GET /api/cats/:id/records`

Returns the timeline: feedings, vet visits, vaccinations, scans, behavior
readings — sorted by date.

### `POST /api/cats/:id/records/feeding`

**Body**

```json
{ "time": "08:00", "food": "dry kibble", "reminder": true }
```

### `POST /api/cats/:id/records/vet-visit`

`multipart/form-data` to allow document uploads.

**Body (form fields)**

```
date, reason, notes, document (file, optional, repeatable)
```

### `POST /api/cats/:id/records/vaccination`

**Body**

```json
{ "vaccine": "Rabies", "date": "2024-05-01", "nextDue": "2025-05-01" }
```

---

## AI Features

### `POST /api/behavior`

Translate behavior tags/notes into a plain-English read.

**Body**

```json
{ "catId": "abc123", "tags": ["hiding", "not eating"], "notes": "started yesterday" }
```

**Response `200`**

```json
{
  "reading": "Your cat may be feeling stressed or unwell...",
  "source": "ollama"
}
```

`source` is `"ollama"` or `"heuristic"` depending on whether the real LLM
responded or the offline fallback was used.

### `POST /api/scan`

Analyze an uploaded photo for visible health cues. `multipart/form-data`.

**Body (form fields)**

```
catId, photo (file)
```

**Response `200`**

```json
{
  "summary": "No obvious signs of distress detected...",
  "flags": ["eye discharge"],
  "source": "ollama"
}
```

Result is also appended to the cat's timeline.

---

## Places

### `GET /api/places/nearby?lat=..&lon=..&type=vet|shelter`

Proxies the Geoapify Places API so the API key never reaches the client.

**Response `200`**

```json
{
  "results": [
    { "name": "Main Street Vet Clinic", "lat": 0, "lon": 0, "address": "..." }
  ]
}
```

Returns `503` with a descriptive message if `GEOAPIFY_API_KEY` is not set.

---

## Export

### `GET /api/export`

Returns a full JSON export of all of the authenticated user's data
(cats, records, timeline) as a downloadable file.
