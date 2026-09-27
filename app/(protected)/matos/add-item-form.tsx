"use client";

import { useActionState, useEffect, useRef } from "react";
import { addItem, type AddItemState } from "./actions";

export function AddItemForm() {
  const [state, formAction, pending] = useActionState<AddItemState, FormData>(
    addItem,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-8 rounded-lg border border-line bg-white p-5"
    >
      <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
        Ajouter un item
      </p>
      <p className="mt-1 text-sm text-muted">
        Il apparaîtra dans la liste de tout le monde.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          name="label"
          type="text"
          required
          maxLength={120}
          placeholder="Ex. corde à linge, jeu de cartes…"
          className="flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-[#2F3437]"
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input type="checkbox" name="shared" className="accent-[#2F3437]" />
          Matos partagé
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            name="taking"
            defaultChecked
            className="accent-[#2F3437]"
          />
          Je le prends
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[#111111] px-4 py-2 text-sm text-white transition-colors hover:bg-[#333333] active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "Ajout…" : "Ajouter"}
        </button>
      </div>
      {state.error && (
        <p className="mt-3 rounded-md bg-[#FDEBEC] px-3 py-2 text-sm text-[#9F2F2D]">
          {state.error}
        </p>
      )}
    </form>
  );
}
