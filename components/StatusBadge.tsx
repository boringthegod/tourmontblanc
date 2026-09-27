const STYLES = {
  confirme: { bg: "#EDF3EC", fg: "#346538", label: "Confirmé" },
  a_reserver: { bg: "#FBF3DB", fg: "#956400", label: "À réserver" },
} as const;

export function StatusBadge({ status }: { status: keyof typeof STYLES }) {
  const s = STYLES[status];
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs uppercase tracking-[0.05em]"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
}
