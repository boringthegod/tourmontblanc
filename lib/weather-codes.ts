// Codes temps sensible WMO 4677, tels que renvoyés par Open-Meteo.
export type CodeFamily =
  | "clair"
  | "nuageux"
  | "brouillard"
  | "pluie"
  | "neige"
  | "orage";

export const STORM_CODES: readonly number[] = [95, 96, 99];

const LABELS: Record<number, string> = {
  0: "Ciel clair",
  1: "Peu nuageux",
  2: "Partiellement nuageux",
  3: "Couvert",
  45: "Brouillard",
  48: "Brouillard givrant",
  51: "Bruine faible",
  53: "Bruine",
  55: "Bruine forte",
  56: "Bruine verglaçante",
  57: "Bruine verglaçante forte",
  61: "Pluie faible",
  63: "Pluie modérée",
  65: "Pluie forte",
  66: "Pluie verglaçante",
  67: "Pluie verglaçante forte",
  71: "Neige faible",
  73: "Neige modérée",
  75: "Neige forte",
  77: "Grains de neige",
  80: "Averses faibles",
  81: "Averses",
  82: "Averses fortes",
  85: "Averses de neige",
  86: "Averses de neige fortes",
  95: "Orage",
  96: "Orage avec grêle",
  99: "Orage violent avec grêle",
};

const FAMILIES: [number[], CodeFamily][] = [
  [[0], "clair"],
  [[1, 2, 3], "nuageux"],
  [[45, 48], "brouillard"],
  [[51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82], "pluie"],
  [[71, 73, 75, 77, 85, 86], "neige"],
  [[95, 96, 99], "orage"],
];

export function weatherLabel(code: number | null): string {
  if (code === null) return "—";
  return LABELS[code] ?? "—";
}

export function weatherFamily(code: number | null): CodeFamily {
  if (code === null) return "nuageux";
  for (const [codes, family] of FAMILIES) {
    if (codes.includes(code)) return family;
  }
  return "nuageux";
}
