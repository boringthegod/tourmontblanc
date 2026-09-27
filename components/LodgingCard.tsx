import type { Lodging } from "@/lib/seed-data";
import { StatusBadge } from "./StatusBadge";

export function LodgingCard({
  lodging,
  who,
}: {
  lodging: Lodging;
  who?: string;
}) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${lodging.name} ${lodging.address}`,
  )}`;
  return (
    <section className="rounded-lg border border-line bg-white p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
            Nuit
          </p>
          <h2 className="mt-1 font-serif text-2xl tracking-tight">
            {lodging.name}
          </h2>
          <p className="text-sm text-muted">{lodging.place}</p>
          {who && (
            <p className="mt-1 text-sm">
              <span className="text-muted">Qui :</span> {who}
            </p>
          )}
        </div>
        <StatusBadge status={lodging.status} />
      </div>

      <dl className="mt-6 space-y-2 text-sm">
        <div className="flex gap-3">
          <dt className="w-20 shrink-0 text-muted">Adresse</dt>
          <dd className="min-w-0 break-words">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-line underline-offset-4 hover:decoration-current"
            >
              {lodging.address}
            </a>
          </dd>
        </div>
        {lodging.phone && (
          <div className="flex gap-3">
            <dt className="w-20 shrink-0 text-muted">Téléphone</dt>
            <dd className="min-w-0 break-words">
              <a href={`tel:${lodging.phone.replace(/\s/g, "")}`}>
                {lodging.phone}
              </a>
            </dd>
          </div>
        )}
        {lodging.email && (
          <div className="flex gap-3">
            <dt className="w-20 shrink-0 text-muted">Email</dt>
            <dd className="min-w-0 break-words">
              <a
                href={`mailto:${lodging.email}`}
                className="underline decoration-line underline-offset-4 hover:decoration-current"
              >
                {lodging.email}
              </a>
            </dd>
          </div>
        )}
        {(lodging.bookingUrl || lodging.website) && (
          <div className="flex gap-3">
            <dt className="w-20 shrink-0 text-muted">
              {lodging.bookingUrl ? "Réserver" : "Site"}
            </dt>
            <dd className="min-w-0 break-words">
              <a
                href={lodging.bookingUrl ?? lodging.website}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-line underline-offset-4 hover:decoration-current"
              >
                {(lodging.bookingUrl ?? lodging.website)!.replace(
                  /^https?:\/\/(www\.)?/,
                  "",
                )}
              </a>
            </dd>
          </div>
        )}
      </dl>

      {lodging.notes.length > 0 && (
        <ul className="mt-6 space-y-2 border-t border-line pt-5 text-sm text-muted">
          {lodging.notes.map((note) => (
            <li key={note} className="flex gap-2">
              <span
                aria-hidden
                className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-[#787774]"
              />
              {note}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
