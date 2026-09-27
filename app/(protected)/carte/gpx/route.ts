import { getDays } from "@/lib/db";
import { buildGpx, type GpxTrack } from "@/lib/gpx";
import { getCurrentUser } from "@/lib/session";
import { getTrail } from "@/lib/trails";

// Les layouts ne protègent pas les route handlers : contrôle de session ici.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Non connecté", { status: 401 });
  const tracks: GpxTrack[] = [];
  for (const day of getDays()) {
    if (day.kind !== "hike") continue;
    const trail = getTrail(day.n);
    if (trail) {
      tracks.push({ name: `Étape ${day.n} : ${day.title}`, coords: trail.coords });
    }
  }
  const gpx = buildGpx("TMB 2026 — Tour complet (7 étapes)", tracks);
  return new Response(gpx, {
    headers: {
      "Content-Type": "application/gpx+xml",
      "Content-Disposition": `attachment; filename="tmb-2026-tour-complet.gpx"`,
    },
  });
}
