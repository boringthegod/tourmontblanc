export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${iso}T12:00:00`));
}

export function hikeStats(d: {
  distanceKm?: number;
  dplus?: number;
  dminus?: number;
  duration?: string;
}): string {
  const parts: string[] = [];
  if (d.distanceKm) parts.push(`~${d.distanceKm} km`);
  if (d.dplus) parts.push(`+${d.dplus} m`);
  if (d.dminus) parts.push(`−${d.dminus} m`);
  if (d.duration) parts.push(d.duration);
  return parts.join(" · ");
}
