import { HourStrip } from "@/components/HourStrip";
import { weatherLabel } from "@/lib/weather-codes";
import type { StagePoint, StageWeather as Stage } from "@/lib/weather";

const CONFIDENCE_LABEL: Record<Stage["confidence"], string> = {
  haute: "Modèle haute résolution",
  fiable: "Prévision fiable",
  tendance: "Tendance — à confirmer en approchant",
};

function heure(minutes: number): string {
  return `~${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, "0")}`;
}

function Ligne({ point }: { point: StagePoint }) {
  const h = point.hour;
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3 text-sm">
      <span className="flex items-baseline gap-3">
        <span className="w-16 shrink-0 font-mono text-xs text-muted">
          {heure(point.minutes)}
        </span>
        <span>{point.name}</span>
        <span className="font-mono text-xs text-muted">
          {Math.round(point.alt)} m
        </span>
      </span>
      {h ? (
        <span className="font-mono text-xs text-muted">
          {h.temp === null ? "—" : `${Math.round(h.temp)}°`}
          {h.feels !== null && ` (ressenti ${Math.round(h.feels)}°)`}
          {" · "}
          {weatherLabel(h.code)}
          {h.gust !== null && h.gust >= 30 && ` · rafales ${Math.round(h.gust)} km/h`}
        </span>
      ) : (
        <span className="font-mono text-xs text-muted">pas de donnée</span>
      )}
    </li>
  );
}

export function StageWeather({ stage }: { stage: Stage }) {
  return (
    <section className="rounded-lg border border-line bg-white p-4 sm:p-8">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
          Météo de l&rsquo;étape
        </p>
        <p className="font-mono text-xs text-muted">
          {CONFIDENCE_LABEL[stage.confidence]}
        </p>
      </div>
      <HourStrip hours={stage.hours} />
      <p className="mt-2 text-xs text-muted">
        Températures là où l&rsquo;on se trouve à chaque heure, selon les
        heures de passage ci-dessous.
      </p>
      <ol className="mt-6 divide-y divide-line rounded-lg border border-line">
        {stage.points.map((p) => (
          <Ligne key={`${p.name}-${p.km}`} point={p} />
        ))}
      </ol>
      <p className="mt-4 text-xs text-muted">
        Heures de passage estimées depuis la durée annoncée de l&rsquo;étape et le
        dénivelé réel, départ à 8h.
      </p>
    </section>
  );
}
