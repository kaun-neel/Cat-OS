import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NotebookPen, Sparkles } from "lucide-react";
import { Reveal, RevealGroup } from "../components/ui/Reveal";
import { EmptyState } from "../components/ui/EmptyState";
import { useToast } from "../components/ui/Toast";
import { useActiveCat } from "../context/ActiveCatContext";
import { behaviorTagOptions } from "../types";
import type { BehaviorLog } from "../types";
import { api, ApiError } from "../lib/api";
import { cn } from "../utils/cn";

type RangeFilter = "week" | "month" | "all";

function withinRange(dateStr: string, range: RangeFilter) {
  if (range === "all") return true;
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  return range === "week" ? diffDays <= 7 : diffDays <= 31;
}

interface Reading {
  interpretation: string;
  confidence: string;
  action: string;
  source?: string;
}

export default function Behavior() {
  const { activeCat } = useActiveCat();
  const [logs, setLogs] = useState<BehaviorLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [range, setRange] = useState<RangeFilter>("all");
  const [reading, setReading] = useState<Reading | null>(null);
  const [translating, setTranslating] = useState(false);
  const [saving, setSaving] = useState(false);
  const { notify } = useToast();

  useEffect(() => {
    if (!activeCat) {
      setLogs([]);
      setLogsLoading(false);
      return;
    }
    setLogsLoading(true);
    api
      .get(`/cats/${activeCat.id}/behavior`)
      .then((res) => setLogs(res.logs))
      .finally(() => setLogsLoading(false));
  }, [activeCat]);

  const filteredLogs = useMemo(
    () => [...logs].sort((a, b) => (a.date < b.date ? 1 : -1)).filter((l) => withinRange(l.date, range)),
    [logs, range]
  );

  function toggleTag(tag: string) {
    setSelectedTags((tags) => (tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]));
  }

  async function handleTranslate() {
    if (!activeCat || (!selectedTags.length && !notes.trim())) return;
    setTranslating(true);
    try {
      const res = await api.post(`/cats/${activeCat.id}/behavior/translate`, { tags: selectedTags, notes });
      setReading(res.reading);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Couldn't translate this behavior right now.");
    } finally {
      setTranslating(false);
    }
  }

  async function addToLog() {
    if (!activeCat || !reading) return;
    setSaving(true);
    try {
      const { log } = await api.post(`/cats/${activeCat.id}/behavior`, {
        tags: selectedTags,
        interpretation: reading.interpretation,
        confidence: reading.confidence,
        action: reading.action,
      });
      setLogs((ls) => [log, ...ls]);
      notify("Behavior log added to file.");
      setReading(null);
      setSelectedTags([]);
      setNotes("");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Couldn't save this log.");
    } finally {
      setSaving(false);
    }
  }

  if (!activeCat) {
    return <EmptyState message="Open a cat file before logging behavior." />;
  }

  return (
    <div className="space-y-10">
      <Reveal>
        <p className="stamp-label border-ink-soft text-ink-soft">Behavior translator</p>
        <h1 className="mt-3 font-display text-3xl text-ink">What is {activeCat.name} telling you</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Select what you're observing, or describe it in your own words. CATOS turns it into a
          plain-English read and a suggested next step.
        </p>
      </Reveal>

      <Reveal>
        <div className="border border-rule bg-paper-raised p-5">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-ink-soft">Observed behaviors</p>
          <div className="flex flex-wrap gap-2">
            {behaviorTagOptions.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  "stamp-label transition-colors",
                  selectedTags.includes(tag)
                    ? "border-leather bg-leather text-paper-raised"
                    : "border-ink-soft text-ink-soft hover:bg-paper"
                )}
              >
                {tag}
              </button>
            ))}
          </div>

          <label className="mt-5 block font-mono text-[11px] uppercase tracking-wide text-ink-soft">
            Additional notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Started two days ago, mostly in the evening"
            className="mt-2 w-full border border-rule bg-paper p-3 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-leather"
          />

          <button
            onClick={handleTranslate}
            disabled={(!selectedTags.length && !notes.trim()) || translating}
            className="mt-5 bg-leather px-5 py-2.5 font-mono text-xs uppercase tracking-wide text-paper-raised disabled:cursor-not-allowed disabled:opacity-40"
          >
            {translating ? "Reading…" : "Translate behavior"}
          </button>
        </div>
      </Reveal>

      <AnimatePresence>
        {reading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="dog-ear border border-rule bg-paper-raised p-6"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={18} strokeWidth={1.5} className="text-leather" />
              <h2 className="font-display text-xl text-ink">Reading</h2>
            </div>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-wide text-ink-soft">
              Tags: {selectedTags.join(", ") || "none"}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink">{reading.interpretation}</p>
            <p className="mt-3 font-mono text-xs text-ink-soft">
              {reading.confidence}
              {reading.source === "fallback" && " (offline heuristic — Ollama not reachable)"}
            </p>
            <div className="stitch-line mt-4 pt-4">
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">Suggested action</p>
              <p className="mt-1 text-sm text-ink">{reading.action}</p>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={addToLog}
                disabled={saving}
                className="bg-leather px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-paper-raised disabled:opacity-50"
              >
                {saving ? "Saving…" : "Add to file"}
              </button>
              <button
                onClick={() => setReading(null)}
                className="border border-rule px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-ink-soft hover:bg-paper"
              >
                Edit inputs
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Reveal>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">Behavior log history</h2>
          <div className="flex gap-0.5">
            {(["week", "month", "all"] as RangeFilter[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide",
                  range === r ? "border-leather bg-paper-raised text-ink" : "border-rule text-ink-soft hover:bg-paper-raised"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {logsLoading ? (
          <p className="mt-4 font-mono text-xs text-ink-soft">Loading…</p>
        ) : filteredLogs.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon={NotebookPen} message="No behavior logs in this range yet." />
          </div>
        ) : (
          <RevealGroup className="mt-4 space-y-3" stagger={0.05}>
            {filteredLogs.map((log) => (
              <Reveal key={log.id}>
                <div className="border border-rule bg-paper-raised p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-ink-soft">{log.date}</span>
                    <div className="flex flex-wrap gap-1">
                      {log.tags.map((t) => (
                        <span key={t} className="stamp-label border-ink-soft text-ink-soft">{t}</span>
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-ink">{log.interpretation}</p>
                  <p className="mt-2 font-mono text-xs text-ink-soft">{log.confidence}</p>
                  <p className="mt-1 text-xs text-ink-soft">Action: {log.action}</p>
                </div>
              </Reveal>
            ))}
          </RevealGroup>
        )}
      </Reveal>
    </div>
  );
}
