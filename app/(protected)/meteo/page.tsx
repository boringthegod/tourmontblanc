import Link from "next/link";
import { HourStrip } from "@/components/HourStrip";
import { WeatherAlerts } from "@/components/WeatherAlerts";
import { formatDate } from "@/lib/format";
import { getTourWeather } from "@/lib/weather";

const CONFIDENCE_LABEL = {
  haute: "Haute résolution",
  fiable: "Fiable",
  tendance: "Tendance",
} as const;

function freshnessLabel(ageMinutes: number | null, stale: boolean): string {
  if (ageMinutes === null) return "Aucune donnée récoltée pour l'instant.";
  const age =
    ageMinutes < 1
      ? "à l'instant"
      : ageMinutes < 60
        ? `il y a ${ageMinutes} min`
        : ageMinutes < 24 * 60
          ? `il y a ${Math.floor(ageMinutes / 60)} h`
          : `il y a ${Math.floor(ageMinutes / (24 * 60))} j`;
  return stale
    ? `Données ${age} — le rafraîchissement a échoué, Open-Meteo est peut-être indisponible.`
    : `Données récoltées ${age}.`;
}

export default async function MeteoPage() {
  const { stages, freshness } = await getTourWeather();

  return (
    <main className="py-8 sm:py-16">
      <header className="rise-in max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
          Prévisions
        </p>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl tracking-tight leading-[1.1]">
          Météo du tour
        </h1>
        <p className="mt-5 text-muted">
          La bande de chaque étape suit le marcheur : à chaque heure, la
          météo du point de passage où l&rsquo;on se trouve, à son altitude
          réelle. Un col à 2 500 m n&rsquo;a pas la météo du fond de vallée.
        </p>
      </header>

      {stages.length === 0 && (
        <p className="mt-10 rounded-lg border border-line bg-white p-8 text-muted">
          Aucune donnée météo pour l&rsquo;instant. Vérifier la connexion, ou
          lancer <code className="font-mono text-sm">node scripts/fetch-weather.mjs</code>.
        </p>
      )}

      <div className="mt-10 space-y-4">
        {stages.map((s, i) => (
          <section
            key={s.day.n}
            className="rise-in rounded-lg border border-line bg-white p-4 sm:p-6"
            style={{ "--index": i + 1 } as React.CSSProperties}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <Link
                href={`/jour/${s.day.n}`}
                className="font-serif text-xl tracking-tight hover:underline"
              >
                {s.day.title}
              </Link>
              <span className="font-mono text-xs text-muted">
                {formatDate(s.day.date)} · {CONFIDENCE_LABEL[s.confidence]}
              </span>
            </div>
            <div className="mt-4">
              <HourStrip hours={s.hours} />
            </div>
            <WeatherAlerts alerts={s.alerts} />
          </section>
        ))}
      </div>

      <p className="mt-8 font-mono text-xs text-muted">
        {freshnessLabel(freshness.ageMinutes, freshness.stale)} Source :
        Open-Meteo.
      </p>
    </main>
  );
}
