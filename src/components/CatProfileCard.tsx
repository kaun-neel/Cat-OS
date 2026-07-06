import { PolaroidPhoto } from "./ui/PolaroidPhoto";
import { StampBadge } from "./ui/StampBadge";
import type { Cat } from "../context/ActiveCatContext";

export function CatProfileCard({ cat }: { cat: Cat }) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <PolaroidPhoto src={cat.photo} alt={cat.name} size="md" rotate={-2} />
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl text-ink">{cat.name}</h1>
          <StampBadge status={cat.status} />
        </div>
        <p className="mt-1 font-mono text-xs uppercase tracking-wide text-ink-soft">
          {cat.breed} — {cat.age} — {cat.sex}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="font-mono text-[11px] uppercase text-ink-soft">Weight</dt>
            <dd className="font-mono text-ink">{cat.weightLbs} lb</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase text-ink-soft">Primary vet</dt>
            <dd className="text-ink">{cat.vet}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase text-ink-soft">Conditions</dt>
            <dd className="text-ink">{cat.conditions.length ? cat.conditions.join(", ") : "None on file"}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase text-ink-soft">File</dt>
            <dd className="font-mono text-ink">{cat.fileNumber}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
