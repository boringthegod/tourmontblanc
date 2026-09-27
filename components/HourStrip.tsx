import type { HourRow } from "@/lib/weather-api";
import { STRIP_FROM, STRIP_TO } from "@/lib/weather";
import {
  weatherFamily,
  weatherLabel,
  type CodeFamily,
} from "@/lib/weather-codes";

// Teintes sourdes, accordées à la palette de l'app (fond #f7f6f3).
const FAMILY_TONE: Record<CodeFamily, string> = {
  clair: "bg-[#FBEFD3]",
  nuageux: "bg-[#E6E5E1]",
  brouillard: "bg-[#DCDCD8]",
  pluie: "bg-[#CFE3F2]",
  neige: "bg-[#E4EDF5]",
  orage: "bg-[#EFD3D5]",
};

// `at` : nom du point de passage où l'on se trouve à cette heure, si connu.
export function HourStrip({
  hours,
  from = STRIP_FROM,
  to = STRIP_TO,
}: {
  hours: (HourRow & { at?: string })[];
  from?: number;
  to?: number;
}) {
  const slice = hours.filter((h) => {
    const hr = Number(h.time.slice(11, 13));
    return hr >= from && hr <= to;
  });
  if (slice.length === 0) {
    return <p className="text-sm text-muted">Pas encore de données.</p>;
  }
  // Grille plutôt que bande défilante : sur téléphone, 11 cases de 2,5 rem
  // dépassaient l'écran et les heures après 13h restaient hors de vue.
  return (
    <div className="grid grid-cols-6 gap-px sm:grid-cols-11">
      {slice.map((h) => {
        const hr = Number(h.time.slice(11, 13));
        return (
          <div
            key={h.time}
            title={`${hr}h${h.at ? ` à ${h.at}` : ""} — ${weatherLabel(h.code)}, ${h.temp ?? "—"} °C, rafales ${Math.round(h.gust ?? 0)} km/h`}
            className={`flex flex-col items-center gap-1 py-2 ${FAMILY_TONE[weatherFamily(h.code)]}`}
          >
            <span className="font-mono text-[10px] text-muted">{hr}h</span>
            <span className="font-mono text-xs">
              {h.temp === null ? "—" : `${Math.round(h.temp)}°`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
