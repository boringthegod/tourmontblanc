import { DayCard } from "@/components/DayCard";
import { getDays, getNights, getTotals } from "@/lib/db";

export default function OverviewPage() {
  const days = getDays();
  const totals = getTotals();
  return (
    <main className="py-10 sm:py-24">
      <header className="rise-in max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
          17 – 25 septembre 2026 · Alice, Émile, Bruno, Chloé, David,
          Farid
        </p>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl tracking-tight leading-[1.1]">
          Tour du Mont Blanc
          <span className="italic"> en 7 jours</span>
        </h1>
        <p className="mt-5 text-muted">
          Chamonix → Chamonix par la France, l&rsquo;Italie et la Suisse.
          Environ <span className="text-foreground">{totals.km} km</span> et{" "}
          <span className="text-foreground">
            {totals.dplus.toLocaleString("fr-FR")} m
          </span>{" "}
          de dénivelé positif, en refuges et gîtes d&rsquo;étape.
        </p>
      </header>

      <div className="mt-14 space-y-4">
        {days.map((day, i) => (
          <DayCard key={day.n} day={day} nights={getNights(day)} index={i} />
        ))}
      </div>
    </main>
  );
}
