import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Paperclip, Upload, CheckCircle2, AlertTriangle, Clock, X } from "lucide-react";
import { Reveal } from "../components/ui/Reveal";
import { EmptyState } from "../components/ui/EmptyState";
import { useToast } from "../components/ui/Toast";
import { useActiveCat } from "../context/ActiveCatContext";
import { api, ApiError } from "../lib/api";
import type { VetVisit, VaccineRecord } from "../types";
import { pullFromStack } from "../lib/motion";
import { cn } from "../utils/cn";

const statusMeta = {
  current: { label: "Current", color: "text-positive", icon: CheckCircle2 },
  overdue: { label: "Overdue", color: "text-stamp-red", icon: AlertTriangle },
  upcoming: { label: "Upcoming", color: "text-clay", icon: Clock },
};

export default function Records() {
  const { activeCat } = useActiveCat();
  const [openId, setOpenId] = useState<string | null>(null);
  const [visits, setVisits] = useState<VetVisit[]>([]);
  const [vaccines, setVaccines] = useState<VaccineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [draft, setDraft] = useState({ date: "", vet: "", reason: "", notes: "" });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { notify } = useToast();

  useEffect(() => {
    if (!activeCat) {
      setVisits([]);
      setVaccines([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([api.get(`/cats/${activeCat.id}/visits`), api.get(`/cats/${activeCat.id}/vaccines`)])
      .then(([v, vc]) => {
        setVisits(v.visits.sort((a: VetVisit, b: VetVisit) => (a.date < b.date ? 1 : -1)));
        setVaccines(vc.vaccines);
      })
      .finally(() => setLoading(false));
  }, [activeCat]);

  async function handleUpload() {
    if (!activeCat || !draft.date || !draft.vet || !draft.reason) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("date", draft.date);
      form.set("vet", draft.vet);
      form.set("reason", draft.reason);
      form.set("notes", draft.notes);
      if (file) form.set("attachment", file);
      const { visit } = await api.postForm(`/cats/${activeCat.id}/visits`, form);
      setVisits((vs) => [visit, ...vs].sort((a, b) => (a.date < b.date ? 1 : -1)));
      setDraft({ date: "", vet: "", reason: "", notes: "" });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setShowUploadForm(false);
      notify("Document uploaded to file.");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Couldn't upload this document.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!activeCat) {
    return <EmptyState message="Open a cat file to view records." />;
  }

  return (
    <div className="space-y-10">
      <Reveal>
        <p className="stamp-label border-ink-soft text-ink-soft">Records</p>
        <h1 className="mt-3 font-display text-3xl text-ink">Vet visits and vaccinations</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Structured history for {activeCat.name}. Click a record to pull it from the stack.
        </p>
      </Reveal>

      <Reveal>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">Visit history</h2>
          <button
            onClick={() => setShowUploadForm((s) => !s)}
            className="flex items-center gap-1.5 border border-leather px-4 py-2 font-mono text-xs uppercase tracking-wide text-leather hover:bg-leather hover:text-paper-raised"
          >
            {showUploadForm ? <X size={13} /> : <Upload size={13} />}
            {showUploadForm ? "Cancel" : "Upload document"}
          </button>
        </div>

        {showUploadForm && (
          <div className="mt-4 border border-rule bg-paper-raised p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-ink-soft">Date</label>
                <input type="date" value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} className="w-full border-b border-rule bg-transparent py-1.5 font-mono text-sm text-ink outline-none focus:border-leather" />
              </div>
              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-ink-soft">Vet / clinic</label>
                <input type="text" placeholder="Dr. Osei — Elm Street" value={draft.vet} onChange={(e) => setDraft((d) => ({ ...d, vet: e.target.value }))} className="w-full border-b border-rule bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-leather" />
              </div>
              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-ink-soft">Reason</label>
                <input type="text" placeholder="Annual checkup" value={draft.reason} onChange={(e) => setDraft((d) => ({ ...d, reason: e.target.value }))} className="w-full border-b border-rule bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-leather" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-ink-soft">Notes</label>
                <input type="text" placeholder="Optional" value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} className="w-full border-b border-rule bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-leather" />
              </div>
              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-ink-soft">Attachment (optional)</label>
                <input
                  ref={fileRef}
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full py-1 text-xs text-ink-soft"
                />
              </div>
            </div>
            <button
              onClick={handleUpload}
              disabled={submitting || !draft.date || !draft.vet || !draft.reason}
              className="mt-4 bg-leather px-4 py-2 font-mono text-xs uppercase tracking-wide text-paper-raised disabled:opacity-50"
            >
              {submitting ? "Uploading…" : "Save document"}
            </button>
          </div>
        )}

        {loading ? (
          <p className="mt-4 font-mono text-xs text-ink-soft">Loading…</p>
        ) : visits.length === 0 ? (
          <div className="mt-4">
            <EmptyState message="No visits on file yet — upload a vet document to begin this cat's record." />
          </div>
        ) : (
          <div className="mt-6 max-w-2xl">
            {visits.map((visit, i) => {
              const isOpen = openId === visit.id;
              return (
                <motion.div
                  key={visit.id}
                  initial="rest"
                  animate={isOpen ? "active" : "rest"}
                  variants={pullFromStack}
                  onClick={() => setOpenId(isOpen ? null : visit.id)}
                  style={{ marginTop: i === 0 ? 0 : -34, zIndex: isOpen ? 20 : visits.length - i }}
                  className={cn(
                    "relative cursor-pointer border border-rule bg-paper-raised p-4 shadow-md transition-shadow",
                    isOpen ? "shadow-xl" : "hover:shadow-lg"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-ink-soft">{visit.date}</span>
                    <span className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">
                      {isOpen ? "Click to close" : "Click to open"}
                    </span>
                  </div>
                  <p className="mt-1 font-display text-lg text-ink">{visit.reason}</p>
                  <p className="font-mono text-xs text-ink-soft">{visit.vet}</p>

                  {isOpen && (
                    <div className="stitch-line mt-3 pt-3">
                      <p className="text-sm text-ink">{visit.notes || "No additional notes."}</p>
                      {visit.attachment && (
                        <a
                          href={visit.attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-3 inline-flex items-center gap-2 border border-rule bg-paper px-3 py-1.5 font-mono text-xs text-ink-soft hover:bg-paper-raised"
                        >
                          <Paperclip size={13} />
                          {visit.attachment.name}
                        </a>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </Reveal>

      <Reveal>
        <h2 className="mb-4 font-display text-xl text-ink">Vaccination status</h2>
        {vaccines.length === 0 ? (
          <EmptyState message="No vaccination records yet." />
        ) : (
          <div className="overflow-x-auto border border-rule bg-paper-raised">
            <table className="w-full min-w-[480px] border-collapse text-left text-sm">
              <thead>
                <tr className="stitch-line">
                  <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-ink-soft">Vaccine</th>
                  <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-ink-soft">Last given</th>
                  <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-ink-soft">Next due</th>
                  <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-ink-soft">Status</th>
                </tr>
              </thead>
              <tbody>
                {vaccines.map((v) => {
                  const meta = statusMeta[v.status];
                  const Icon = meta.icon;
                  return (
                    <tr key={v.id} className="stitch-line">
                      <td className="px-4 py-3 text-ink">{v.vaccine}</td>
                      <td className="px-4 py-3 font-mono text-ink-soft">{v.lastGiven}</td>
                      <td className="px-4 py-3 font-mono text-ink-soft">{v.nextDue}</td>
                      <td className="px-4 py-3">
                        <span className={cn("stamp-label", meta.color)} style={{ borderColor: "currentColor" }}>
                          <Icon size={12} />
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-ink-soft">
          Reminders are sent five days before each due date. Manage reminder timing in settings.
        </p>
      </Reveal>
    </div>
  );
}
