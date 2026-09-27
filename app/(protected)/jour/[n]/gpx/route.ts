import { notFound } from "next/navigation";
import { getDay } from "@/lib/db";
import { buildGpx } from "@/lib/gpx";
import { getCurrentUser } from "@/lib/session";
import { getTrail } from "@/lib/trails";

// Les layouts ne protègent pas les route handlers : contrôle de session ici.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ n: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Non connecté", { status: 401 });
  const { n: raw } = await params;
  const n = Number(raw);
  const day = getDay(n);
  const trail = getTrail(n);
  if (!day || !trail) notFound();
  const name = `TMB 2026 — Étape ${n} : ${day.title}`;
  const gpx = buildGpx(name, [{ name, coords: trail.coords }]);
  return new Response(gpx, {
    headers: {
      "Content-Type": "application/gpx+xml",
      "Content-Disposition": `attachment; filename="tmb-2026-etape-${n}.gpx"`,
    },
  });
}
