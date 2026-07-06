import { ArrowRight } from "lucide-react";
import { IndexCard } from "../ui/IndexCard";

export function CaseFileCard({
  photo,
  concern,
  action,
  fileNumber,
}: {
  photo: string;
  concern: string;
  action: string;
  fileNumber: string;
}) {
  return (
    <IndexCard hover className="p-5">
      <div className="mb-4 aspect-[4/3] w-full overflow-hidden bg-paper">
        <img src={photo} alt="" className="h-full w-full object-cover grayscale-[15%]" />
      </div>
      <p className="stamp-label border-ink-soft text-ink-soft">{fileNumber}</p>
      <div className="mt-3 space-y-1">
        <p className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">Detected concern</p>
        <p className="text-sm text-ink">{concern}</p>
      </div>
      <div className="mt-3 flex items-start gap-2">
        <ArrowRight size={14} className="mt-0.5 shrink-0 text-clay" strokeWidth={2} />
        <p className="text-sm text-ink-soft">{action}</p>
      </div>
    </IndexCard>
  );
}
