import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <>
      <header className="sticky top-0 z-[1001] border-b border-line bg-[#F7F6F3]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm sm:gap-x-6">
            <Link href="/" className="font-serif text-lg tracking-tight">
              TMB 2026
            </Link>
            <Link href="/" className="text-muted hover:text-foreground">
              Le tour
            </Link>
            <Link href="/carte" className="text-muted hover:text-foreground">
              Carte
            </Link>
            <Link href="/meteo" className="text-muted hover:text-foreground">
              Météo
            </Link>
            <Link href="/matos" className="text-muted hover:text-foreground">
              Mon matos
            </Link>
            <Link href="/equipe" className="text-muted hover:text-foreground">
              L&rsquo;équipe
            </Link>
          </nav>
          <div className="flex shrink-0 items-center gap-3 text-sm">
            <span className="hidden sm:inline text-muted">{user.name}</span>
            <form action="/logout" method="post">
              <button
                type="submit"
                className="rounded-md border border-line bg-white px-3 py-1.5 text-xs text-muted transition-colors hover:text-foreground"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6">{children}</div>
    </>
  );
}
