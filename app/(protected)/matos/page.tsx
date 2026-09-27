import { getGearItems, getUserGear } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { AddItemForm } from "./add-item-form";
import { GearList } from "./gear-list";

export default async function GearPage() {
  const user = (await getCurrentUser())!;
  const items = getGearItems();
  const initial = getUserGear(user.id);
  return (
    <main className="py-10 sm:py-24">
      <header className="rise-in max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
          Checklist de {user.name}
        </p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight leading-[1.1]">
          Mon matos
        </h1>
        <p className="mt-4 text-muted">
          Coche ce que tu prends, puis marque-le « dans le sac » au moment de
          le préparer. Les items <em>partagés</em> n&rsquo;ont besoin
          d&rsquo;être pris que par une personne du groupe — voir la page
          équipe.
        </p>
      </header>
      <div className="rise-in mt-10" style={{ "--index": 1 } as React.CSSProperties}>
        <GearList items={items} initial={initial} />
        <AddItemForm />
      </div>
    </main>
  );
}
