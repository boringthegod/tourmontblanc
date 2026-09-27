import { redirect } from "next/navigation";
import { listUsers } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");
  const names = listUsers().map((u) => u.name);
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm rise-in">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted mb-3">
          17 – 25 septembre 2026
        </p>
        <h1 className="font-serif text-4xl tracking-tight leading-[1.1] mb-10">
          Tour du
          <br />
          Mont Blanc
        </h1>
        <LoginForm names={names} />
      </div>
    </main>
  );
}
