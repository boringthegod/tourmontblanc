import { getTeamGear, getUnclaimedSharedItems, listUsers } from "@/lib/db";

export default function TeamPage() {
  const users = listUsers();
  const rows = getTeamGear();
  const unclaimed = getUnclaimedSharedItems();
  return (
    <main className="py-10 sm:py-24">
      <header className="rise-in max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
          {users.map((u) => u.name).join(" · ")}
        </p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight leading-[1.1]">
          Qui prend quoi
        </h1>
      </header>

      {unclaimed.length > 0 && (
        <aside
          className="rise-in mt-8 rounded-lg bg-[#FDEBEC] px-5 py-4 text-sm text-[#9F2F2D]"
          style={{ "--index": 1 } as React.CSSProperties}
        >
          <p className="font-medium">
            Matos partagé que personne n&rsquo;a encore pris :
          </p>
          <ul className="mt-1 list-inside list-disc">
            {unclaimed.map((item) => (
              <li key={item.id}>{item.label}</li>
            ))}
          </ul>
        </aside>
      )}

      <div
        className="rise-in mt-10 overflow-x-auto rounded-lg border border-line bg-white"
        style={{ "--index": 2 } as React.CSSProperties}
      >
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="px-5 py-3 text-left font-normal text-muted">
                Item
              </th>
              {users.map((u) => (
                <th
                  key={u.id}
                  className="px-2 py-3 text-center font-mono text-xs font-normal uppercase tracking-[0.1em] text-muted"
                >
                  {u.name.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(({ item, byUser }) => {
              const nobodyShared =
                item.shared && !users.some((u) => byUser[u.name].taking);
              return (
                <tr key={item.id} className={nobodyShared ? "bg-[#FDEBEC]/40" : ""}>
                  <td className="px-5 py-2.5">
                    {item.label}
                    {item.shared && (
                      <span className="ml-2 inline-block rounded-full bg-[#E1F3FE] px-2 py-0.5 text-xs uppercase tracking-[0.05em] text-[#1F6C9F]">
                        Partagé
                      </span>
                    )}
                  </td>
                  {users.map((u) => {
                    const s = byUser[u.name];
                    return (
                      <td key={u.id} className="px-2 py-2.5 text-center">
                        {s.packed ? (
                          <span
                            title="Dans le sac"
                            className="inline-block h-3 w-3 rounded-full bg-[#346538]"
                          />
                        ) : s.taking ? (
                          <span
                            title="Pris"
                            className="inline-block h-3 w-3 rounded-full border-2 border-[#346538] bg-white"
                          />
                        ) : (
                          <span className="text-line">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-muted">
        Cercle plein : dans le sac · cercle vide : pris, pas encore packé ·
        tiret : pas pris.
      </p>
    </main>
  );
}
