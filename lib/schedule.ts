// Estimation de l'heure de passage à chaque point de passage.
//
// On répartit la durée annoncée par le topo sur les segments au prorata de leur
// coût Naismith (km / 4.5 + D+ / 600), et non de leur seule distance : un
// prorata kilométrique placerait le marcheur au col une à deux heures trop tôt.
// Le dénivelé vient du tracé réel échantillonné, donc il compte les bosses
// intermédiaires qu'une différence d'altitude entre extrémités ignore.

export const DEPARTURE_HOUR = 8;

const KM_PER_HOUR = 4.5;
const ASCENT_M_PER_HOUR = 600;

export type Eta = {
  name: string;
  km: number;
  alt: number;
  minutes: number;
  hourKey: string;
};

export function parseDuration(s: string | undefined): number | null {
  const m = s?.match(/^(\d+)h(\d{1,2})?$/);
  if (!m) return null;
  return Number(m[1]) + (m[2] ? Number(m[2]) / 60 : 0);
}

// Dénivelé positif cumulé le long du profil jusqu'à untilKm.
export function cumulativeAscent(
  points: { km: number; alt: number }[],
  untilKm: number,
): number {
  let ascent = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].km > untilKm) break;
    const d = points[i].alt - points[i - 1].alt;
    if (d > 0) ascent += d;
  }
  return ascent;
}

function hourKeyFor(date: string, minutes: number): string {
  const h = Math.min(23, Math.max(0, Math.round(minutes / 60)));
  return `${date}T${String(h).padStart(2, "0")}:00`;
}

export function stageEta(input: {
  date: string;
  duration?: string;
  marks: { name: string; km: number; alt: number }[];
  points?: { km: number; alt: number }[] | null;
}): Eta[] {
  const { date, duration, marks, points } = input;
  if (marks.length === 0) return [];

  // Coût Naismith de chaque segment, cumulé.
  const cum: number[] = [0];
  for (let i = 1; i < marks.length; i++) {
    const km = Math.max(0, marks[i].km - marks[i - 1].km);
    const ascent = points
      ? Math.max(
          0,
          cumulativeAscent(points, marks[i].km) -
            cumulativeAscent(points, marks[i - 1].km),
        )
      : 0;
    cum.push(cum[i - 1] + km / KM_PER_HOUR + ascent / ASCENT_M_PER_HOUR);
  }

  const naismithTotal = cum[cum.length - 1];
  // La durée du topo fait foi si elle existe ; sinon Naismith brut.
  const hours = parseDuration(duration) ?? naismithTotal;
  const start = DEPARTURE_HOUR * 60;

  return marks.map((m, i) => {
    const frac = naismithTotal > 0 ? cum[i] / naismithTotal : 0;
    const minutes = Math.round(start + frac * hours * 60);
    return {
      name: m.name,
      km: m.km,
      alt: m.alt,
      minutes,
      hourKey: hourKeyFor(date, minutes),
    };
  });
}
