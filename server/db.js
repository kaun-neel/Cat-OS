// Lightweight JSON-file persistence layer.
// No native dependencies (no better-sqlite3 etc.) so it installs and runs
// anywhere — including Windows without build tools — which matters for a
// hackathon demo. Data is real, user-entered data, written to disk on every
// change. Swap this module out for a real database later if you outgrow it;
// every other file only calls the functions exported here.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const emptyData = () => ({
  users: [],
  cats: [],
  timelineEntries: [],
  vaccines: [],
  visits: [],
  feedingEntries: [],
  behaviorLogs: [],
});

function load() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(emptyData(), null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch {
    return emptyData();
  }
}

let data = load();
let saveTimer = null;

function persist() {
  // Debounce writes slightly so rapid successive updates don't thrash disk.
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  }, 50);
}

export function id() {
  return crypto.randomUUID();
}

export function now() {
  return new Date().toISOString();
}

// Generic collection helpers -------------------------------------------------

export function all(collection) {
  return data[collection];
}

export function find(collection, predicate) {
  return data[collection].find(predicate);
}

export function filter(collection, predicate) {
  return data[collection].filter(predicate);
}

export function insert(collection, record) {
  data[collection].push(record);
  persist();
  return record;
}

export function update(collection, matchId, patch) {
  const idx = data[collection].findIndex((r) => r.id === matchId);
  if (idx === -1) return null;
  data[collection][idx] = { ...data[collection][idx], ...patch };
  persist();
  return data[collection][idx];
}

export function remove(collection, matchId) {
  const before = data[collection].length;
  data[collection] = data[collection].filter((r) => r.id !== matchId);
  persist();
  return data[collection].length !== before;
}

export function removeWhere(collection, predicate) {
  data[collection] = data[collection].filter((r) => !predicate(r));
  persist();
}

// Exposed for rare cases where a route needs a direct handle (kept minimal).
export function raw() {
  return data;
}
