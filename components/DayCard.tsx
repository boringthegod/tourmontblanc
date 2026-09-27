import Link from "next/link";
import type { Day, Lodging } from "@/lib/seed-data";
import { formatDate, hikeStats } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

export function DayCard({
  day,
  nights,
  index,
}: {
  day: Day;
  nights: { lodging: Lodging; who?: string }[];
  index: number;
}) {
  const stats = day.kind === "hike" ? hikeStats(day) : null;
  return (
    <Link
      href={`/jour/${day.n}`}
      className="rise-in group block rounded-lg border border-line bg-white p-5 sm:p-6 transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
      style={{ "--index": index } as React.CSSProperties}
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
          {day.kind === "hike" ? `Étape ${day.n}` : "Transit"} —{" "}
          {formatDate(day.date)}
        </p>
        {stats && (
          <p className="hidden sm:block font-mono text-xs text-muted">{stats}</p>
        )}
      </div>
      <h2 className="mt-2 font-serif text-2xl tracking-tight leading-[1.15] group-hover:underline decoration-[1px] underline-offset-4">
        {day.title}
      </h2>
      {stats && (
        <p className="mt-1 sm:hidden font-mono text-xs text-muted">{stats}</p>
      )}
      <div className="mt-4 space-y-1 text-sm text-muted">
        {nights.length === 0 && <span>Retour chez soi</span>}
        {nights.map(({ lodging, who }) => (
          <div
            key={lodging.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-1"
          >
            <span>
              Nuit : <span className="text-foreground">{lodging.name}</span>
              {who && <span> ({who})</span>}
            </span>
            <StatusBadge status={lodging.status} />
          </div>
        ))}
      </div>
      {day.transportNote && (
        <p className="mt-3 border-t border-line pt-3 text-sm text-muted">
          {day.transportNote}
        </p>
      )}
    </Link>
  );
}
