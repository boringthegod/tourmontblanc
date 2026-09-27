import Link from "next/link";
import { TourMapView } from "@/components/TourMapView";
import type { TourNight, TourStage } from "@/components/TourMap";
import { getDays, getNights } from "@/lib/db";
import { stageColor } from "@/lib/stage-colors";

export default function MapPage() {
  const hikes = getDays().filter((d) => d.kind === "hike");

  const stages: TourStage[] = hikes.map((d) => ({
    n: d.n,
    title: d.title,
    color: stageColor(d.n),
    positions: d.waypoints.map((w) => [w.lat, w.lng] as [number, number]),
  }));

  // Les nuits : la base à Chamonix + le point d'arrivée de chaque étape.
  const nights: TourNight[] = [
    {
      label: "Chamonix — base",
      sub: "Location (nuits du 17 et du 24)",
      lat: 45.9237,
      lng: 6.8694,
      kind: "base",
    },
    ...hikes.flatMap((d) => {
      const end = d.waypoints[d.waypoints.length - 1];
      const date = new Date(`${d.date}T12:00:00`).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
      });
      return getNights(d)
        .filter(({ lodging }) => lodging.id !== "base")
        .map(({ lodging, who }) => ({
          label: lodging.name,
          sub: `Nuit du ${date}${who ? ` — ${who}` : ""}`,
          lat: lodging.lat ?? end.lat,
          lng: lodging.lng ?? end.lng,
          kind: "refuge" as const,
        }));
    }),
  ];

  return (
    <main className="py-10 sm:py-24">
      <header className="rise-in max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
          Vue d&rsquo;ensemble
        </p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight leading-[1.1]">
          La carte du tour
        </h1>
        <p className="mt-4 text-muted">
          Les 7 étapes autour du massif, départ et retour à Chamonix. Survole
          un tracé pour voir l&rsquo;étape, un point pour voir la nuit — et
          passe en relief 3D pour voir ce qui vous attend.
        </p>
        <a
          href="/carte/gpx"
          download
          className="mt-4 inline-block rounded-md border border-line bg-white px-3 py-1.5 text-xs text-muted transition-colors hover:text-foreground"
        >
          Télécharger le GPX du tour (7 étapes)
        </a>
      </header>

      <div className="rise-in mt-10" style={{ "--index": 1 } as React.CSSProperties}>
        <TourMapView stages={stages} nights={nights} />
      </div>

      <div
        className="rise-in mt-8 grid gap-2 sm:grid-cols-2"
        style={{ "--index": 2 } as React.CSSProperties}
      >
        {stages.map((s) => {
          const day = hikes.find((d) => d.n === s.n)!;
          return (
            <Link
              key={s.n}
              href={`/jour/${s.n}`}
              className="group flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 text-sm transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
            >
              <span
                aria-hidden
                className="h-3 w-6 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="flex-1">
                <span className="font-mono text-xs uppercase tracking-[0.1em] text-muted">
                  Étape {s.n}
                </span>
                <span className="block group-hover:underline decoration-[1px] underline-offset-4">
                  {s.title}
                </span>
              </span>
              <span className="shrink-0 whitespace-nowrap font-mono text-xs text-muted">
                ~{day.distanceKm} km · +{day.dplus} m
              </span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
