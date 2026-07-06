import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";

import * as db from "./db.js";
import { signToken, requireAuth, jwtSecretIsDevDefault } from "./auth.js";
import { translateBehavior, analyzeScanPhoto, llmConfig } from "./llm.js";
import { findNearbyPlaces } from "./places.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..");
const UPLOADS_DIR = path.join(__dirname, "uploads");
const DIST_DIR = path.join(PROJECT_ROOT, "dist");

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const app = express();
const PORT = process.env.PORT || 4000;

// Security headers (Helmet). Sets CSP, HSTS, X-Content-Type-Options,
// X-Frame-Options, etc. CSP is scoped to this app's actual external
// resources: Google Fonts (index.html) and OpenStreetMap tiles (Vets &
// Shelters map). crossOriginEmbedderPolicy is disabled because those two
// third-party origins aren't guaranteed to send CORP/CORS headers CORP
// would require, and enabling it would risk silently breaking fonts/tiles.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        // 'unsafe-inline' is required here because React and Framer Motion
        // set inline style="" attributes directly on DOM nodes throughout
        // the app (animations, dynamic widths/rotations, chart tooltips).
        // script-src above stays strict — that's what matters most for XSS.
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        // data: for onboarding's FileReader photo preview, blob: for
        // Scan's URL.createObjectURL() photo preview, OSM for the map tiles.
        imgSrc: ["'self'", "data:", "blob:", "https://*.tile.openstreetmap.org"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use("/uploads", express.static(UPLOADS_DIR));

// ── File upload handling (multer) ───────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${db.id()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Only image uploads are allowed."));
    cb(null, true);
  },
});

function fileToUrl(file) {
  return file ? `/uploads/${file.filename}` : null;
}

function fileToBase64(file) {
  const buf = fs.readFileSync(file.path);
  return buf.toString("base64");
}

// ── Helpers ──────────────────────────────────────────────────────────────
function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

function requireCatOwnership(req, res, next) {
  const cat = db.find("cats", (c) => c.id === req.params.catId && c.userId === req.userId);
  if (!cat) return res.status(404).json({ error: "Cat file not found." });
  req.cat = cat;
  next();
}

function computeStatusFromRisk(riskScore) {
  if (riskScore >= 55) return "ATTENTION";
  if (riskScore >= 25) return "MONITOR";
  return "STABLE";
}

// ── Auth routes ──────────────────────────────────────────────────────────
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  if (db.find("users", (u) => u.email === normalizedEmail)) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: db.id(),
    email: normalizedEmail,
    name: String(name).trim(),
    passwordHash,
    notifications: { feeding: true, vaccinations: true, scanResults: true },
    createdAt: db.now(),
  };
  db.insert("users", user);
  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db.find("users", (u) => u.email === normalizedEmail);
  if (!user) return res.status(401).json({ error: "Invalid email or password." });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password." });
  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  const user = db.find("users", (u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user: publicUser(user) });
});

app.patch("/api/auth/me/notifications", requireAuth, (req, res) => {
  const user = db.find("users", (u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: "User not found." });
  const notifications = { ...user.notifications, ...req.body };
  const updated = db.update("users", user.id, { notifications });
  res.json({ user: publicUser(updated) });
});

app.get("/api/export", requireAuth, (req, res) => {
  const cats = db.filter("cats", (c) => c.userId === req.userId);
  const catIds = new Set(cats.map((c) => c.id));
  const payload = {
    exportedAt: db.now(),
    cats,
    timelineEntries: db.filter("timelineEntries", (t) => catIds.has(t.catId)),
    vaccines: db.filter("vaccines", (v) => catIds.has(v.catId)),
    visits: db.filter("visits", (v) => catIds.has(v.catId)),
    feedingEntries: db.filter("feedingEntries", (f) => catIds.has(f.catId)),
    behaviorLogs: db.filter("behaviorLogs", (b) => catIds.has(b.catId)),
  };
  res.setHeader("Content-Disposition", "attachment; filename=catos-export.json");
  res.json(payload);
});

// ── Cats ─────────────────────────────────────────────────────────────────
app.get("/api/cats", requireAuth, (req, res) => {
  res.json({ cats: db.filter("cats", (c) => c.userId === req.userId) });
});

app.post("/api/cats", requireAuth, upload.single("photo"), (req, res) => {
  const { name, breed, age, weightLbs, sex, conditions, vet } = req.body;
  if (!name || !String(name).trim()) return res.status(400).json({ error: "Name is required." });
  if (!breed || !String(breed).trim()) return res.status(400).json({ error: "Breed is required." });
  if (!req.file) return res.status(400).json({ error: "A photo is required to open a file." });

  const existingCount = db.filter("cats", (c) => c.userId === req.userId).length;
  const cat = {
    id: db.id(),
    userId: req.userId,
    name: String(name).trim(),
    breed: String(breed).trim(),
    age: age?.trim() || "Unknown",
    weightLbs: weightLbs ? Number(weightLbs) : null,
    sex: sex?.trim() || "Unknown",
    conditions: conditions ? String(conditions).split(",").map((c) => c.trim()).filter(Boolean) : [],
    vet: vet?.trim() || "",
    status: "STABLE",
    photo: fileToUrl(req.file),
    fileNumber: `FILE #${String(existingCount + 1).padStart(3, "0")}`,
    createdAt: db.now(),
  };
  db.insert("cats", cat);
  res.status(201).json({ cat });
});

app.get("/api/cats/:catId", requireAuth, requireCatOwnership, (req, res) => {
  res.json({ cat: req.cat });
});

app.patch("/api/cats/:catId", requireAuth, requireCatOwnership, upload.single("photo"), (req, res) => {
  const patch = {};
  for (const key of ["name", "breed", "age", "sex", "vet"]) {
    if (req.body[key] !== undefined) patch[key] = String(req.body[key]).trim();
  }
  if (req.body.weightLbs !== undefined) patch.weightLbs = Number(req.body.weightLbs);
  if (req.body.conditions !== undefined) {
    patch.conditions = String(req.body.conditions).split(",").map((c) => c.trim()).filter(Boolean);
  }
  if (req.file) patch.photo = fileToUrl(req.file);
  const cat = db.update("cats", req.cat.id, patch);
  res.json({ cat });
});

app.delete("/api/cats/:catId", requireAuth, requireCatOwnership, (req, res) => {
  db.remove("cats", req.cat.id);
  db.removeWhere("timelineEntries", (t) => t.catId === req.cat.id);
  db.removeWhere("vaccines", (v) => v.catId === req.cat.id);
  db.removeWhere("visits", (v) => v.catId === req.cat.id);
  db.removeWhere("feedingEntries", (f) => f.catId === req.cat.id);
  db.removeWhere("behaviorLogs", (b) => b.catId === req.cat.id);
  res.json({ ok: true });
});

// ── Timeline ─────────────────────────────────────────────────────────────
app.get("/api/cats/:catId/timeline", requireAuth, requireCatOwnership, (req, res) => {
  res.json({ entries: db.filter("timelineEntries", (t) => t.catId === req.cat.id) });
});

app.post("/api/cats/:catId/timeline", requireAuth, requireCatOwnership, (req, res) => {
  const { type, title, note, weight, riskScore, photo, date } = req.body || {};
  if (!type || !title) return res.status(400).json({ error: "type and title are required." });
  const entry = {
    id: db.id(),
    catId: req.cat.id,
    date: date || db.now().slice(0, 10),
    type,
    title,
    note: note || "",
    weight: weight !== undefined ? Number(weight) : undefined,
    riskScore: riskScore !== undefined ? Number(riskScore) : undefined,
    photo: photo || undefined,
  };
  db.insert("timelineEntries", entry);
  if (entry.riskScore !== undefined) {
    db.update("cats", req.cat.id, { status: computeStatusFromRisk(entry.riskScore) });
  }
  if (entry.weight !== undefined) {
    db.update("cats", req.cat.id, { weightLbs: entry.weight });
  }
  res.status(201).json({ entry });
});

// ── Vaccines ─────────────────────────────────────────────────────────────
app.get("/api/cats/:catId/vaccines", requireAuth, requireCatOwnership, (req, res) => {
  res.json({ vaccines: db.filter("vaccines", (v) => v.catId === req.cat.id) });
});

app.post("/api/cats/:catId/vaccines", requireAuth, requireCatOwnership, (req, res) => {
  const { vaccine, lastGiven, nextDue, status } = req.body || {};
  if (!vaccine || !lastGiven || !nextDue) {
    return res.status(400).json({ error: "vaccine, lastGiven, and nextDue are required." });
  }
  const record = { id: db.id(), catId: req.cat.id, vaccine, lastGiven, nextDue, status: status || "current" };
  db.insert("vaccines", record);
  res.status(201).json({ vaccine: record });
});

app.patch("/api/vaccines/:id", requireAuth, (req, res) => {
  const record = db.find("vaccines", (v) => v.id === req.params.id);
  if (!record) return res.status(404).json({ error: "Vaccine record not found." });
  const cat = db.find("cats", (c) => c.id === record.catId && c.userId === req.userId);
  if (!cat) return res.status(404).json({ error: "Vaccine record not found." });
  const updated = db.update("vaccines", record.id, req.body || {});
  res.json({ vaccine: updated });
});

// ── Vet visits ───────────────────────────────────────────────────────────
app.get("/api/cats/:catId/visits", requireAuth, requireCatOwnership, (req, res) => {
  res.json({ visits: db.filter("visits", (v) => v.catId === req.cat.id) });
});

app.post("/api/cats/:catId/visits", requireAuth, requireCatOwnership, upload.single("attachment"), (req, res) => {
  const { date, vet, reason, notes } = req.body || {};
  if (!date || !vet || !reason) return res.status(400).json({ error: "date, vet, and reason are required." });
  const visit = {
    id: db.id(),
    catId: req.cat.id,
    date,
    vet,
    reason,
    notes: notes || "",
    attachment: req.file ? { name: req.file.originalname, url: fileToUrl(req.file) } : undefined,
  };
  db.insert("visits", visit);
  res.status(201).json({ visit });
});

// ── Feeding ──────────────────────────────────────────────────────────────
app.get("/api/cats/:catId/feeding", requireAuth, requireCatOwnership, (req, res) => {
  res.json({ entries: db.filter("feedingEntries", (f) => f.catId === req.cat.id) });
});

app.post("/api/cats/:catId/feeding", requireAuth, requireCatOwnership, (req, res) => {
  const { day, time, portion, food, notes, reminder } = req.body || {};
  if (!time || !portion || !food) return res.status(400).json({ error: "time, portion, and food are required." });
  const entry = {
    id: db.id(),
    catId: req.cat.id,
    day: day || "Every day",
    time,
    portion,
    food,
    notes: notes || "",
    reminder: reminder !== undefined ? Boolean(reminder) : true,
  };
  db.insert("feedingEntries", entry);
  res.status(201).json({ entry });
});

app.patch("/api/feeding/:id", requireAuth, (req, res) => {
  const entry = db.find("feedingEntries", (f) => f.id === req.params.id);
  if (!entry) return res.status(404).json({ error: "Feeding entry not found." });
  const cat = db.find("cats", (c) => c.id === entry.catId && c.userId === req.userId);
  if (!cat) return res.status(404).json({ error: "Feeding entry not found." });
  const updated = db.update("feedingEntries", entry.id, req.body || {});
  res.json({ entry: updated });
});

app.delete("/api/feeding/:id", requireAuth, (req, res) => {
  const entry = db.find("feedingEntries", (f) => f.id === req.params.id);
  if (!entry) return res.status(404).json({ error: "Feeding entry not found." });
  const cat = db.find("cats", (c) => c.id === entry.catId && c.userId === req.userId);
  if (!cat) return res.status(404).json({ error: "Feeding entry not found." });
  db.remove("feedingEntries", entry.id);
  res.json({ ok: true });
});

// ── Behavior ─────────────────────────────────────────────────────────────
app.get("/api/cats/:catId/behavior", requireAuth, requireCatOwnership, (req, res) => {
  res.json({ logs: db.filter("behaviorLogs", (b) => b.catId === req.cat.id) });
});

app.post("/api/cats/:catId/behavior/translate", requireAuth, requireCatOwnership, async (req, res) => {
  const { tags = [], notes = "" } = req.body || {};
  if (!tags.length && !notes.trim()) {
    return res.status(400).json({ error: "Provide at least one tag or a note." });
  }
  const recentScan = db
    .filter("timelineEntries", (t) => t.catId === req.cat.id && t.type === "scan")
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];

  const reading = await translateBehavior({
    catName: req.cat.name,
    tags,
    notes,
    recentScanNote: recentScan?.note,
  });
  res.json({ reading, tags, notes });
});

app.post("/api/cats/:catId/behavior", requireAuth, requireCatOwnership, (req, res) => {
  const { tags = [], interpretation, confidence, action, date } = req.body || {};
  if (!interpretation || !action) return res.status(400).json({ error: "interpretation and action are required." });
  const log = {
    id: db.id(),
    catId: req.cat.id,
    date: date || db.now().slice(0, 10),
    tags,
    interpretation,
    confidence: confidence || "",
    action,
  };
  db.insert("behaviorLogs", log);
  db.insert("timelineEntries", {
    id: db.id(),
    catId: req.cat.id,
    date: log.date,
    type: "behavior",
    title: tags.length ? `Behavior logged: ${tags.join(", ")}` : "Behavior logged",
    note: interpretation,
  });
  res.status(201).json({ log });
});

// ── Scan (LLM vision) ────────────────────────────────────────────────────
app.post("/api/cats/:catId/scan", requireAuth, requireCatOwnership, upload.single("photo"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "A photo is required." });
  const base64Image = fileToBase64(req.file);
  const result = await analyzeScanPhoto({
    base64Image,
    catName: req.cat.name,
    fileSizeBytes: req.file.size,
  });
  if (result.error) {
    return res.status(200).json({ error: result.error, photoUrl: fileToUrl(req.file) });
  }
  res.json({ result, photoUrl: fileToUrl(req.file) });
});

app.post("/api/cats/:catId/scan/save", requireAuth, requireCatOwnership, (req, res) => {
  const { photoUrl, riskScore, findings, recommendation } = req.body || {};
  if (!photoUrl || riskScore === undefined) {
    return res.status(400).json({ error: "photoUrl and riskScore are required." });
  }
  const entry = {
    id: db.id(),
    catId: req.cat.id,
    date: db.now().slice(0, 10),
    type: "scan",
    title: "Photo health read",
    note: recommendation || "",
    riskScore: Number(riskScore),
    photo: photoUrl,
  };
  db.insert("timelineEntries", entry);
  db.update("cats", req.cat.id, { status: computeStatusFromRisk(Number(riskScore)) });
  res.status(201).json({ entry, findings });
});

// ── Nearby vets & shelters (Geoapify) ────────────────────────────────────
app.get("/api/places", requireAuth, async (req, res) => {
  const { lat, lon, type } = req.query;
  if (!lat || !lon || !type) return res.status(400).json({ error: "lat, lon, and type are required." });
  try {
    const places = await findNearbyPlaces({ lat: Number(lat), lon: Number(lon), type });
    res.json({ places });
  } catch (err) {
    const status = err.code === "NO_API_KEY" ? 501 : 502;
    res.status(status).json({ error: err.message });
  }
});

// ── Health / config check ───────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    llm: llmConfig,
    geoapifyConfigured: Boolean(process.env.GEOAPIFY_API_KEY),
  });
});

// ── Error handler (e.g. multer file-type/size errors) ───────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(400).json({ error: err.message || "Something went wrong." });
});

// ── Serve built frontend in production ──────────────────────────────────
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`CATOS server running on http://localhost:${PORT}`);
  if (jwtSecretIsDevDefault) {
    console.warn(
      "⚠ JWT_SECRET not set in .env — using an insecure dev default. Generate one with:\n" +
        "   node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"\n" +
        "  and add it to your .env file as JWT_SECRET=<value> before deploying."
    );
  }
  if (!process.env.GEOAPIFY_API_KEY) {
    console.warn("⚠ GEOAPIFY_API_KEY not set — Vets & Shelters page will show a setup message. See server/places.js.");
  }
  console.log(
    `Ollama base URL: ${llmConfig.baseUrl} (model: ${llmConfig.model}, vision: ${llmConfig.visionModel}, cloud key: ${
      llmConfig.cloudKeyConfigured ? "set" : "not set"
    })`
  );
});
