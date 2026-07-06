import { useEffect, useState } from "react";
import { Bell, BellOff, Plus, X } from "lucide-react";
import { Reveal } from "../components/ui/Reveal";
import { EmptyState } from "../components/ui/EmptyState";
import { useToast } from "../components/ui/Toast";
import { useActiveCat } from "../context/ActiveCatContext";
import { api, ApiError } from "../lib/api";
import type { FeedingEntry } from "../types";
import { cn } from "../utils/cn";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function Feeding() {
  const { cats, activeCat, setActiveCatId } = useActiveCat();
  const [view, setView] = useState<"list" | "grid">("list");
  const [entries, setEntries] = useState<FeedingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ time: "", portion: "", food: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const { notify } = useToast();

  useEffect(() => {
    if (!activeCat) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get(`/cats/${activeCat.id}/feeding`)
      .then((res) => setEntries(res.entries.sort((a: FeedingEntry, b: FeedingEntry) => a.time.localeCompare(b.time))))
      .finally(() => setLoading(false));
  }, [activeCat]);

  async function toggleReminder(entry: FeedingEntry) {
    setEntries((es) => es.map((e) => (e.id === entry.id ? { ...e, reminder: !e.reminder } : e)));
    try {
      await api.patch(`/feeding/${entry.id}`, { reminder: !entry.reminder });
    } catch (err) {
      setEntries((es) => es.map((e) => (e.id === entry.id ? { ...e, reminder: entry.reminder } : e)));
      notify(err instanceof ApiError ? err.message : "Couldn't update reminder.");
    }
  }

  async function addEntry() {
    if (!activeCat || !draft.time || !draft.portion || !draft.food) return;
    setSubmitting(true);
    try {
      const { entry } = await api.post(`/cats/${activeCat.id}/feeding`, { ...draft, day: "Every day" });
      setEntries((es) => [...es, entry].sort((a, b) => a.time.localeCompare(b.time)));
      setDraft({ time: "", portion: "", food: "", notes: "" });
      setShowForm(false);
      notify("Feeding entry added to file.");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Couldn't add this entry.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!activeCat) {
    return <EmptyState message="Open a cat file before setting up a feeding schedule." />;
  }

  return (
    <div className="space-y-8">
      <Reveal>
        <p className="stamp-label border-ink-soft text-ink-soft">Care schedule</p>
        <h1 className="mt-3 font-display text-3xl text-ink">Feeding schedule</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Portions, times, and reminders for {activeCat.name}, kept as a ledger.
        </p>
      </Reveal>

      {cats.length > 1 && (
        <Reveal>
          <div className="flex gap-0.5 overflow-x-auto">
            {cats.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCatId(c.id)}
                className={cn(
                  "folder-tab -mb-px shrink-0 border border-b-0 border-rule px-4 py-2 font-mono text-xs uppercase tracking-wide",
                  activeCat.id === c.id ? "bg-paper-raised text-ink" : "bg-rule/40 text-ink-soft hover:bg-rule/60"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </Reveal>
      )}

      <Reveal>
        <div className="flex items-center justify-between">
          <div className="flex gap-0.5">
            {(["list", "grid"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide",
                  view === v ? "border-leather bg-paper-raised text-ink" : "border-rule text-ink-soft hover:bg-paper-raised"
                )}
              >
                {v === "list" ? "Ledger view" : "Weekly grid"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1.5 bg-leather px-4 py-2 font-mono text-xs uppercase tracking-wide text-paper-raised"
          >
            {showForm ? <X size={13} /> : <Plus size={13} />}
            {showForm ? "Cancel" : "Add entry"}
          </button>
        </div>
      </Reveal>

      {showForm && (
        <Reveal>
          <div className="border border-rule bg-paper-raised p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-ink-soft">Time</label>
                <input type="time" value={draft.time} onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))} className="w-full border-b border-rule bg-transparent py-1.5 font-mono text-sm text-ink outline-none focus:border-leather" />
              </div>
              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-ink-soft">Portion</label>
                <input type="text" placeholder="1/3 cup" value={draft.portion} onChange={(e) => setDraft((d) => ({ ...d, portion: e.target.value }))} className="w-full border-b border-rule bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-leather" />
              </div>
              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-ink-soft">Food type</label>
                <input type="text" placeholder="Dry — chicken" value={draft.food} onChange={(e) => setDraft((d) => ({ ...d, food: e.target.value }))} className="w-full border-b border-rule bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-leather" />
              </div>
              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-ink-soft">Notes</label>
                <input type="text" placeholder="Optional" value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} className="w-full border-b border-rule bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-leather" />
              </div>
            </div>
            <button
              onClick={addEntry}
              disabled={submitting || !draft.time || !draft.portion || !draft.food}
              className="mt-4 bg-leather px-4 py-2 font-mono text-xs uppercase tracking-wide text-paper-raised disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save entry"}
            </button>
          </div>
        </Reveal>
      )}

      {loading ? (
        <p className="font-mono text-xs text-ink-soft">Loading…</p>
      ) : entries.length === 0 ? (
        <EmptyState message="No feeding entries yet — add one to start this cat's schedule." />
      ) : view === "list" ? (
        <Reveal>
          <div className="overflow-x-auto border border-rule bg-paper-raised">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="stitch-line">
                  <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-ink-soft">Time</th>
                  <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-ink-soft">Portion</th>
                  <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-ink-soft">Food</th>
                  <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-ink-soft">Notes</th>
                  <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-ink-soft">Reminder</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="stitch-line">
                    <td className="px-4 py-3 font-mono text-ink">{entry.time}</td>
                    <td className="px-4 py-3 font-mono text-ink">{entry.portion}</td>
                    <td className="px-4 py-3 text-ink">{entry.food}</td>
                    <td className="px-4 py-3 text-ink-soft">{entry.notes || "—"}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleReminder(entry)} className="flex items-center gap-1.5 font-mono text-xs text-ink-soft">
                        {entry.reminder ? <Bell size={14} className="text-leather" /> : <BellOff size={14} />}
                        {entry.reminder ? "On" : "Off"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      ) : (
        <Reveal>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {days.map((day) => (
              <div key={day} className="border border-rule bg-paper-raised p-4">
                <p className="font-display text-base text-ink">{day}</p>
                <div className="stitch-line mt-2 space-y-2 pt-2">
                  {entries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between font-mono text-xs text-ink-soft">
                      <span>{entry.time}</span>
                      <span>{entry.portion}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}
