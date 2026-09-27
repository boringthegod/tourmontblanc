"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm({ names }: { names: string[] }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    {},
  );
  return (
    <form action={formAction} className="space-y-6">
      <fieldset>
        <legend className="text-sm text-muted mb-2">Qui es-tu ?</legend>
        <div className="grid grid-cols-3 gap-2">
          {names.map((name) => (
            <label
              key={name}
              className="cursor-pointer rounded-md border border-line bg-white px-3 py-2 text-center text-sm transition-colors has-checked:border-[#2F3437] has-checked:bg-[#2F3437] has-checked:text-white"
            >
              <input
                type="radio"
                name="name"
                value={name}
                required
                className="sr-only"
              />
              {name}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="password" className="block text-sm text-muted mb-2">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-[#2F3437]"
        />
      </div>
      {state.error && (
        <p className="rounded-md bg-[#FDEBEC] px-3 py-2 text-sm text-[#9F2F2D]">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-[#111111] px-4 py-2.5 text-sm text-white transition-colors hover:bg-[#333333] active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Connexion…" : "Entrer"}
      </button>
    </form>
  );
}
