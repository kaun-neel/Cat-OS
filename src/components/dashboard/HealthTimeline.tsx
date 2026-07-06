import { ScanEye, MessageSquareText, UtensilsCrossed, Stethoscope } from "lucide-react";
import { RevealGroup, Reveal } from "../ui/Reveal";
import { EmptyState } from "../ui/EmptyState";
import type { TimelineEntry } from "../../types";

const iconByType = {
  scan: ScanEye,
  behavior: MessageSquareText,
  feeding: UtensilsCrossed,
  vet: Stethoscope,
};

export function HealthTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (!entries.length) {
    return <EmptyState message="No entries yet — upload a photo to start this cat's file." />;
  }

  const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <RevealGroup className="flex gap-4 overflow-x-auto pb-3" stagger={0.06}>
      {sorted.map((entry) => {
        const Icon = iconByType[entry.type];
        return (
          <Reveal key={entry.id} className="w-64 shrink-0">
            <div className="h-full border border-rule bg-paper-raised p-4 transition-transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-ink-soft">{entry.date}</span>
                <Icon size={15} className="text-leather" strokeWidth={1.5} />
              </div>
              {entry.photo && (
                <div className="mt-3 h-28 w-full overflow-hidden bg-paper">
                  <img src={entry.photo} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <p className="mt-3 font-display text-base text-ink">{entry.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">{entry.note}</p>
              <div className="mt-3 flex gap-3 font-mono text-[11px] text-ink-soft">
                {entry.weight && <span>{entry.weight} lb</span>}
                {entry.riskScore !== undefined && <span>Risk {entry.riskScore}</span>}
              </div>
            </div>
          </Reveal>
        );
      })}
    </RevealGroup>
  );
}
