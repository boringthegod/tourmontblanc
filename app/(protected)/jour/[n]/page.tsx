import Link from "next/link";
import { notFound } from "next/navigation";
import { ElevationProfile } from "@/components/ElevationProfile";
import { LodgingCard } from "@/components/LodgingCard";
import { StageMapView } from "@/components/StageMapView";
import { StageWeather } from "@/components/StageWeather";
import { WeatherAlerts } from "@/components/WeatherAlerts";
import { getDay, getDays, getNights } from "@/lib/db";
import { formatDate, hikeStats } from "@/lib/format";
import { getProfile } from "@/lib/trails";
import { getStageWeather } from "@/lib/weather";

export default async function DayPage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n: raw } = await params;
  const n = Number(raw);
  const day = getDay(n);
  if (!day) notFound();
  const nights = getNights(day);
  const last = getDays().length - 1;
  const stats = day.kind === "hike" ? hikeStats(day) : null;

  const profile = day.kind === "hike" ? getProfile(day.n, day.waypoints) : null;
  const points =
    profile?.points ?? day.waypoints.map((w) => ({ km: w.km, alt: w.alt }));
  const marks = profile?.marks ?? day.waypoints;
  const weather = day.kind === "hike" ? await getStageWeather(day.n) : null;

  return (
    <main className="py-8 sm:py-16">
      <nav className="rise-in flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        <Link href="/" className="text-muted hover:text-foreground">
          ← Tout le tour
        </Link>
        <div className="flex gap-4">
          {n > 0 && (
            <Link
              href={`/jour/${n - 1}`}
              className="text-muted hover:text-foreground"
            >
              Jour précédent
            </Link>
          )}
          {n < last && (
            <Link
              href={`/jour/${n + 1}`}
              className="text-muted hover:text-foreground"
            >
              Jour suivant →
            </Link>
          )}
        </div>
      </nav>

      <header className="rise-in mt-10 max-w-3xl" style={{ "--index": 1 } as React.CSSProperties}>
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
          {day.kind === "hike" ? `Étape ${day.n}` : "Transit"} —{" "}
          {formatDate(day.date)}
        </p>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl tracking-tight leading-[1.1]">
          {day.title}
        </h1>
        {stats && (
          <p className="mt-4 flex flex-wrap items-center gap-4 font-mono text-sm text-muted">
            {stats}
            <a
              href={`/jour/${n}/gpx`}
              download
              className="rounded-md border border-line bg-white px-3 py-1 font-sans text-xs text-muted transition-colors hover:text-foreground"
            >
              Télécharger le GPX
            </a>
          </p>
        )}
        <p className="mt-5 text-muted">{day.description}</p>
        {day.transportNote && (
          <p className="mt-4 rounded-md bg-[#E1F3FE] px-4 py-3 text-sm text-[#1F6C9F]">
            {day.transportNote}
          </p>
        )}
        {weather && <WeatherAlerts alerts={weather.alerts} />}
      </header>

      {day.kind === "hike" && (
        <div className="rise-in mt-12 space-y-10" style={{ "--index": 2 } as React.CSSProperties}>
          <StageMapView
            n={day.n}
            title={day.title}
            waypoints={day.waypoints}
            nightLabel={nights[0]?.lodging.name}
          />
          <section className="rounded-lg border border-line bg-white p-4 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted mb-4">
              Dénivelé
            </p>
            <ElevationProfile
              points={points}
              marks={marks}
              caption={
                profile
                  ? "Profil du tracé réel (routage OSM) — altitudes en m."
                  : "Profil schématique d'après les points de passage — altitudes en m."
              }
            />
          </section>
          {weather && <StageWeather stage={weather} />}
          <section>
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted mb-3">
              Points de passage
            </p>
            <ol className="divide-y divide-line rounded-lg border border-line bg-white">
              {marks.map((m) => (
                <li
                  key={`${m.name}-${m.km}`}
                  className="flex items-baseline justify-between gap-4 px-5 py-2.5 text-sm"
                >
                  <span>{m.name}</span>
                  <span className="shrink-0 whitespace-nowrap font-mono text-xs text-muted">
                    km {m.km.toFixed(1)} · {Math.round(m.alt)} m
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}

      {nights.length > 0 && (
        <div
          className="rise-in mt-10 space-y-4"
          style={{ "--index": 3 } as React.CSSProperties}
        >
          {nights.map(({ lodging, who }) => (
            <LodgingCard key={lodging.id} lodging={lodging} who={who} />
          ))}
        </div>
      )}
    </main>
  );
}
