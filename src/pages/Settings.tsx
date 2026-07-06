import { useState } from "react";
import { Trash2, Download, Bell } from "lucide-react";
import { useActiveCat } from "../context/ActiveCatContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/Toast";
import { api, getToken, ApiError } from "../lib/api";
import { cn } from "../utils/cn";

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const { cats, removeCat } = useActiveCat();
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const { notify } = useToast();

  const notifications = user?.notifications ?? { feeding: true, vaccinations: true, scanResults: true };

  async function toggle(key: keyof typeof notifications) {
    if (!user) return;
    setSavingKey(key);
    try {
      await api.patch("/auth/me/notifications", { [key]: !notifications[key] });
      await refreshUser();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Couldn't update that setting.");
    } finally {
      setSavingKey(null);
    }
  }

  async function handleRemove(catId: string, name: string) {
    if (!window.confirm(`Remove ${name}'s file? This deletes all timeline, records, and behavior history for this cat and cannot be undone.`)) {
      return;
    }
    try {
      await removeCat(catId);
      notify(`${name}'s file removed.`);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Couldn't remove this file.");
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const token = getToken();
      const res = await fetch("/api/export", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error("Export failed.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "catos-export.json";
      a.click();
      URL.revokeObjectURL(url);
      notify("Export downloaded.");
    } catch {
      notify("Couldn't export records right now.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <p className="stamp-label border-ink-soft text-ink-soft">Settings</p>
        <h1 className="mt-3 font-display text-3xl text-ink">Account and preferences</h1>
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg text-ink">Account</h2>
        <div className="border border-rule bg-paper-raised p-4">
          <div className="flex items-center justify-between border-b border-rule/70 py-2 text-sm">
            <span className="text-ink-soft">Name</span>
            <span className="text-ink">{user?.name}</span>
          </div>
          <div className="flex items-center justify-between border-b border-rule/70 py-2 text-sm">
            <span className="text-ink-soft">Email</span>
            <span className="text-ink">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 text-sm">
            <span className="text-ink-soft">Household</span>
            <span className="font-mono text-ink">{cats.length} cat file{cats.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg text-ink">Notifications</h2>
        <div className="border border-rule bg-paper-raised p-4">
          {([
            ["feeding", "Feeding reminders"],
            ["vaccinations", "Vaccination due dates"],
            ["scanResults", "Scan result summaries"],
          ] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between border-b border-rule/70 py-3 text-sm last:border-b-0">
              <span className="flex items-center gap-2 text-ink">
                <Bell size={14} className="text-ink-soft" />
                {label}
              </span>
              <button
                onClick={() => toggle(key)}
                disabled={savingKey === key}
                className={cn(
                  "h-5 w-9 rounded-full border border-rule transition-colors disabled:opacity-50",
                  notifications[key] ? "bg-leather" : "bg-paper"
                )}
              >
                <span
                  className={cn(
                    "block h-4 w-4 rounded-full bg-paper-raised shadow transition-transform",
                    notifications[key] ? "translate-x-4" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg text-ink">Manage cats</h2>
        <div className="border border-rule bg-paper-raised">
          {cats.length === 0 ? (
            <p className="px-4 py-4 text-sm text-ink-soft">No cat files yet.</p>
          ) : (
            cats.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between border-b border-rule/70 px-4 py-3 last:border-b-0">
                <div>
                  <p className="text-sm text-ink">{cat.name}</p>
                  <p className="font-mono text-[11px] text-ink-soft">{cat.fileNumber}</p>
                </div>
                <button
                  onClick={() => handleRemove(cat.id, cat.name)}
                  className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-stamp-red hover:underline"
                >
                  <Trash2 size={13} />
                  Remove file
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg text-ink">Data</h2>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 border border-rule px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-ink-soft hover:bg-paper-raised disabled:opacity-50"
        >
          <Download size={14} />
          {exporting ? "Preparing…" : "Export all records"}
        </button>
      </section>
    </div>
  );
}
