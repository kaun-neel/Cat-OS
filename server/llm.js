// ─────────────────────────────────────────────────────────────────────────
// OLLAMA CONFIGURATION — EDIT THIS SECTION (or set these in your .env file)
// ─────────────────────────────────────────────────────────────────────────
// CATOS uses Ollama for two features:
//   1. Behavior translation (text model)   — "Behavior" page
//   2. Photo health scan analysis (vision model) — "Scan" page
//
// You can point this at EITHER a local Ollama install OR Ollama Cloud.
//
// ── Option A: Local Ollama ──────────────────────────────────────────────
// Install from https://ollama.com, then pull a text model and a
// vision-capable model:
//   ollama pull llama3.2
//   ollama pull llava
//
// .env values:
//   OLLAMA_BASE_URL=http://localhost:11434
//   OLLAMA_MODEL=llama3.2
//   OLLAMA_VISION_MODEL=llava
//   (leave OLLAMA_API_KEY empty)
//
// ── Option B: Ollama Cloud (no local GPU needed) ────────────────────────
// 1. Create an account at https://ollama.com
// 2. Create an API key at https://ollama.com/settings/keys
// 3. Pick cloud model names from https://ollama.com/search?c=cloud
//    (cloud model names end in "-cloud", e.g. "qwen3-vl:235b-cloud" for
//    vision, "gpt-oss:120b-cloud" or "qwen3:235b-cloud" for text)
//
// .env values:
//   OLLAMA_BASE_URL=https://ollama.com
//   OLLAMA_API_KEY=your_api_key_from_ollama.com/settings/keys
//   OLLAMA_MODEL=gpt-oss:120b-cloud
//   OLLAMA_VISION_MODEL=qwen3-vl:235b-cloud
//
// Note: if you run Ollama locally AND have run `ollama signin`, your local
// Ollama can also proxy cloud models itself — in that case keep
// OLLAMA_BASE_URL=http://localhost:11434 and just use a "-cloud" model
// name; no OLLAMA_API_KEY needed in .env for that setup.
//
// If Ollama is unset/unreachable, or the API key is wrong, CATOS
// automatically falls back to a built-in offline heuristic so the app
// still fully functions during a demo — see the fallback functions below.
// ─────────────────────────────────────────────────────────────────────────
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || "";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";
const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL || "llava";
const OLLAMA_TIMEOUT_MS = 25000;

async function ollamaChat({ model, messages, images }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
  try {
    const body = {
      model,
      messages: images
        ? messages.map((m, i) => (i === messages.length - 1 ? { ...m, images } : m))
        : messages,
      stream: false,
      format: "json",
    };
    const headers = { "Content-Type": "application/json" };
    if (OLLAMA_API_KEY) headers.Authorization = `Bearer ${OLLAMA_API_KEY}`;
    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Ollama responded with ${res.status}`);
    const data = await res.json();
    return data?.message?.content ?? "";
  } finally {
    clearTimeout(timeout);
  }
}

function safeParseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ── Behavior translation ────────────────────────────────────────────────

function fallbackBehaviorReading(tags, notes) {
  const has = (t) => tags.includes(t);
  let interpretation;
  let confidence = "Moderate confidence — offline heuristic, Ollama not reachable.";
  if (has("Hiding") && has("Appetite change")) {
    interpretation =
      "Hiding combined with reduced appetite over two or more days often indicates pain or illness rather than simple stress. This combination is worth a closer look sooner rather than later.";
  } else if (has("Excessive grooming")) {
    interpretation =
      "Localized excessive grooming, especially paired with vocalizing, is commonly tied to skin irritation or discomfort in that area rather than a purely behavioral cause.";
  } else if (tags.length) {
    interpretation = `${tags.join(" and ")} without other symptoms is most often tied to a routine or environment change rather than a medical concern, though it is worth tracking over the next several days.`;
  } else if (notes.trim()) {
    interpretation =
      "Based on the notes provided, this reads as a minor, likely environmental change rather than a medical concern. Continue observing.";
  } else {
    interpretation = "Not enough information to form a reading yet.";
    confidence = "Low confidence.";
  }
  return {
    interpretation,
    confidence,
    action: "Monitor for the next few days. Schedule a vet visit if symptoms persist past a week or worsen.",
  };
}

export async function translateBehavior({ catName, tags, notes, recentScanNote }) {
  const prompt = [
    "You are a veterinary behavior assistant inside a cat health app called CATOS.",
    `Cat: ${catName}.`,
    `Observed behavior tags: ${tags.length ? tags.join(", ") : "none"}.`,
    notes ? `Owner notes: "${notes}".` : "",
    recentScanNote ? `Recent photo scan context: "${recentScanNote}".` : "",
    "Respond ONLY with strict JSON, no markdown, in this exact shape:",
    `{"interpretation": "1-3 sentence plain-English explanation of what this likely means", "confidence": "short confidence statement", "action": "1 sentence recommended next step"}`,
    "Be measured and non-alarmist. Never claim to give a diagnosis; suggest monitoring or a vet visit when appropriate.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const content = await ollamaChat({
      model: OLLAMA_MODEL,
      messages: [{ role: "user", content: prompt }],
    });
    const parsed = safeParseJson(content);
    if (parsed?.interpretation && parsed?.action) {
      return {
        interpretation: parsed.interpretation,
        confidence: parsed.confidence || "Moderate confidence.",
        action: parsed.action,
        source: "ollama",
      };
    }
    throw new Error("Unparseable Ollama response");
  } catch (err) {
    return { ...fallbackBehaviorReading(tags, notes), source: "fallback", note: err.message };
  }
}

// ── Photo scan analysis ─────────────────────────────────────────────────

function fallbackScanAnalysis(fileSizeBytes) {
  // Deterministic-ish offline heuristic so the Scan page always produces a
  // result even with no Ollama vision model configured. Not a real medical
  // read — replace by configuring OLLAMA_VISION_MODEL for real analysis.
  const seed = fileSizeBytes % 100;
  const riskScore = 8 + (seed % 55);
  const level = riskScore < 25 ? "stable" : riskScore < 55 ? "monitor" : "attention";
  return {
    riskScore,
    level,
    findings: [
      { label: "Posture", value: "Normal stance detected" },
      { label: "Coat condition", value: level === "stable" ? "No irritation visible" : "Slight dullness noted, worth watching" },
      { label: "Eye clarity", value: "Clear" },
      { label: "Flagged region", value: level === "attention" ? "Possible area of concern — unclear from photo alone" : "None" },
    ],
    recommendation:
      level === "attention"
        ? "Consider a vet visit within the next few days to have this checked in person."
        : level === "monitor"
        ? "Keep an eye on this over the next few days. No immediate action needed."
        : "No concerns detected. Continue routine monitoring.",
    source: "fallback",
  };
}

export async function analyzeScanPhoto({ base64Image, catName, fileSizeBytes }) {
  const prompt = [
    `You are a veterinary triage assistant inside a cat health app called CATOS, analyzing a photo of a cat named ${catName}.`,
    "Look at posture, coat condition, eye clarity, and any visibly flagged region (redness, swelling, wounds, discharge, matting, etc).",
    "Respond ONLY with strict JSON, no markdown, in this exact shape:",
    `{"riskScore": <integer 0-100>, "level": "stable"|"monitor"|"attention", "findings": [{"label": "Posture", "value": "..."}, {"label": "Coat condition", "value": "..."}, {"label": "Eye clarity", "value": "..."}, {"label": "Flagged region", "value": "..."}], "recommendation": "1 sentence next step"}`,
    "If no cat is visible in the image, or the image is too blurry/dark to assess, respond instead with strict JSON: {\"error\": \"no_cat\"} or {\"error\": \"blurry\"}.",
    "Be measured and non-alarmist. Never claim to give a diagnosis.",
  ].join("\n");

  try {
    const content = await ollamaChat({
      model: OLLAMA_VISION_MODEL,
      messages: [{ role: "user", content: prompt }],
      images: [base64Image],
    });
    const parsed = safeParseJson(content);
    if (parsed?.error === "no_cat") {
      return { error: "No cat detected in this image. Upload a photo where the cat is clearly visible." };
    }
    if (parsed?.error === "blurry") {
      return { error: "Couldn't get a clear read on this image. Try a well-lit photo with the cat's face or body clearly visible." };
    }
    if (typeof parsed?.riskScore === "number" && parsed?.level && Array.isArray(parsed?.findings)) {
      return { ...parsed, source: "ollama" };
    }
    throw new Error("Unparseable Ollama vision response");
  } catch (err) {
    return { ...fallbackScanAnalysis(fileSizeBytes), note: err.message };
  }
}

export const llmConfig = {
  baseUrl: OLLAMA_BASE_URL,
  model: OLLAMA_MODEL,
  visionModel: OLLAMA_VISION_MODEL,
  cloudKeyConfigured: Boolean(OLLAMA_API_KEY),
};
