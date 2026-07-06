import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ScanEye, MessageSquareText, CalendarClock, Syringe, UtensilsCrossed } from "lucide-react";
import { CatProfileCard } from "../components/CatProfileCard";
import { HealthTimeline } from "../components/dashboard/HealthTimeline";
import { RiskChart } from "../components/dashboard/RiskChart";
import { IndexCard } from "../components/ui/IndexCard";
import { Reveal, RevealGroup } from "../components/ui/Reveal";
import { EmptyState } from "../components/ui/EmptyState";
import { useActiveCat } from "../context/ActiveCatContext";
import { api } from "../lib/api";
import type { TimelineEntry, VaccineRecord, FeedingEntry } from "../types";

const quickActions = [
  { to: "/app/scan", label: "Scan a photo", icon: ScanEye },
  { to: "/app/behavior", label: "Log behavior", icon: MessageSquareText },
  { to: "/app/feeding", label: "Check schedule", icon: CalendarClock },
];

export default function Dashboard() {
  const { activeCat, loading: catsLoading } = useActiveCat();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [vaccines, setVaccines] = useState<VaccineRecord[]>([]);
  const [feeding, setFeeding] = useState<FeedingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeCat) {
      setEntries([]);
      setVaccines([]);
      setFeeding([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.get(`/cats/${activeCat.id}/timeline`),
      api.get(`/cats/${activeCat.id}/vaccines`),
      api.get(`/cats/${activeCat.id}/feeding`),
    ])
      .then(([t, v, f]) => {
        if (cancelled) return;
        setEntries(t.entries);
        setVaccines(v.vaccines);
        setFeeding(f.entries.sort((a: FeedingEntry, b: FeedingEntry) => a.time.localeCompare(b.time)));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [activeCat]);

  if (catsLoading || loading) {
    return <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">Loading file…</p>;
  }

  if (!activeCat) {
    return (
      <EmptyState message="No cat file yet. Open a file to get started." />
    );
  }

  const nextVaccine = vaccines.find((v) => v.status !== "current");
  const nextFeeding = feeding[0];

  return (
    <div className="space-y-10">
      <Reveal>
        <IndexCard className="p-6">
          <CatProfileCard cat={activeCat} />
        </IndexCard>
      </Reveal>

      <Reveal>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">Quick actions</h2>
        </div>
        <div className="flex flex-wrap gap-0.5">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="folder-tab flex items-center gap-2 border border-b-2 border-rule bg-paper-raised px-4 py-2.5 text-sm text-ink transition-colors hover:bg-paper"
            >
              <action.icon size={15} strokeWidth={1.5} className="text-leather" />
              {action.label}
            </Link>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <h2 className="mb-3 font-display text-xl text-ink">Health timeline</h2>
        <HealthTimeline entries={entries} />
      </Reveal>

      <Reveal>
        <IndexCard className="p-5" dogEar={false}>
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Weight trend</h2>
            <span className="font-mono text-[11px] text-ink-soft">last {entries.filter((e) => e.weight).length} readings</span>
          </div>
          {entries.some((e) => e.weight) ? (
            <RiskChart entries={entries} />
          ) : (
            <div className="py-8">
              <EmptyState message="No weight readings yet — add one from Scan or Records." />
            </div>
          )}
        </IndexCard>
      </Reveal>

      <Reveal>
        <h2 className="mb-3 font-display text-xl text-ink">Upcoming</h2>
        <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2" stagger={0.08}>
          <Reveal>
            <div className="flex items-start gap-3 border border-rule bg-paper-raised p-4">
              <UtensilsCrossed size={18} className="mt-0.5 text-leather" strokeWidth={1.5} />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">Next feeding</p>
                <p className="mt-1 text-sm text-ink">
                  {nextFeeding ? `${nextFeeding.time} — ${nextFeeding.portion} ${nextFeeding.food}` : "Nothing scheduled"}
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal>
            <div className="flex items-start gap-3 border border-rule bg-paper-raised p-4">
              <Syringe size={18} className={`mt-0.5 ${nextVaccine?.status === "overdue" ? "text-stamp-red" : "text-leather"}`} strokeWidth={1.5} />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">
                  {nextVaccine?.status === "overdue" ? "Overdue vaccination" : "Next vaccination due"}
                </p>
                <p className="mt-1 text-sm text-ink">
                  {nextVaccine ? `${nextVaccine.vaccine} — due ${nextVaccine.nextDue}` : "All vaccinations current"}
                </p>
              </div>
            </div>
          </Reveal>
        </RevealGroup>
      </Reveal>
    </div>
  );
}
