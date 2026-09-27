"use client";

export function MapToggle({
  mode,
  onChange,
}: {
  mode: "2d" | "3d";
  onChange: (mode: "2d" | "3d") => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-line bg-white p-0.5 text-xs">
      {(["2d", "3d"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`rounded px-3 py-1.5 transition-colors ${
            mode === m
              ? "bg-[#2F3437] text-white"
              : "text-muted hover:text-foreground"
          }`}
        >
          {m === "2d" ? "Carte 2D" : "Relief 3D"}
        </button>
      ))}
    </div>
  );
}
