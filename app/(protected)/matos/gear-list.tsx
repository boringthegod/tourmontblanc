"use client";

import { useOptimistic, useTransition } from "react";
import type { GearItem, GearState } from "@/lib/db";
import { toggleGear } from "./actions";

type Props = {
  items: GearItem[];
  initial: Record<number, GearState>;
};

const EMPTY: GearState = { taking: false, packed: false };

export function GearList({ items, initial }: Props) {
  const [, startTransition] = useTransition();
  const [state, apply] = useOptimistic(
    initial,
    (
      prev,
      action: { itemId: number; field: "taking" | "packed"; value: boolean },
    ) => {
      const current = prev[action.itemId] ?? EMPTY;
      const next = { ...current, [action.field]: action.value };
      if (action.field === "taking" && !action.value) next.packed = false;
      return { ...prev, [action.itemId]: next };
    },
  );

  const taken = items.filter((i) => state[i.id]?.taking);
  const packed = taken.filter((i) => state[i.id]?.packed);

  const toggle = (itemId: number, field: "taking" | "packed") => {
    const value = !(state[itemId] ?? EMPTY)[field];
    startTransition(async () => {
      apply({ itemId, field, value });
      await toggleGear(itemId, field, value);
    });
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        <Progress label="Je prends" value={taken.length} total={items.length} />
        <Progress
          label="Dans le sac"
          value={packed.length}
          total={taken.length}
        />
      </div>

      <ul className="mt-8 divide-y divide-line rounded-lg border border-line bg-white">
        {items.map((item) => {
          const s = state[item.id] ?? EMPTY;
          return (
            <li
              key={item.id}
              className="flex items-center gap-4 px-5 py-3 text-sm"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={s.taking}
                aria-label={`Je prends : ${item.label}`}
                onClick={() => toggle(item.id, "taking")}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                  s.taking
                    ? "border-[#2F3437] bg-[#2F3437] text-white"
                    : "border-line bg-white"
                }`}
              >
                {s.taking && <Check />}
              </button>
              <span
                className={`flex-1 ${s.taking ? "" : "text-muted"} ${
                  s.packed ? "line-through decoration-[1px]" : ""
                }`}
              >
                {item.label}
                {item.shared && (
                  <span className="ml-2 inline-block rounded-full bg-[#E1F3FE] px-2 py-0.5 text-xs uppercase tracking-[0.05em] text-[#1F6C9F]">
                    Partagé
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => toggle(item.id, "packed")}
                disabled={!s.taking}
                className={`rounded-md border px-2.5 py-1 text-xs transition-colors disabled:opacity-30 ${
                  s.packed
                    ? "border-[#346538] bg-[#EDF3EC] text-[#346538]"
                    : "border-line bg-white text-muted hover:text-foreground"
                }`}
              >
                {s.packed ? "Dans le sac" : "À packer"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Progress({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-muted">{label}</p>
        <p className="font-mono text-xs text-muted">
          {value}/{total}
        </p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#F0EFEC]">
        <div
          className="h-full rounded-full bg-[#2F3437] transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Check() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
      <path
        d="M1.5 5.5 4 8l4.5-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
