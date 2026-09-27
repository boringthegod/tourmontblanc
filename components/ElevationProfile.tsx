export type ProfilePoint = { km: number; alt: number };
export type ProfileMark = { name: string; km: number; alt: number };

// Profil de dénivelé (SVG) — points denses du tracé réel, ou waypoints en repli.
export function ElevationProfile({
  points,
  marks,
  caption,
}: {
  points: ProfilePoint[];
  marks: ProfileMark[];
  caption: string;
}) {
  if (points.length < 2) return null;
  const W = 800;
  const H = 220;
  const PAD = { top: 28, right: 16, bottom: 34, left: 48 };
  const totalKm = points[points.length - 1].km;
  const alts = points.map((p) => p.alt);
  const minAlt = Math.floor((Math.min(...alts) - 100) / 250) * 250;
  const maxAlt = Math.ceil((Math.max(...alts) + 100) / 250) * 250;

  const x = (km: number) =>
    PAD.left + (km / totalKm) * (W - PAD.left - PAD.right);
  const y = (alt: number) =>
    PAD.top +
    (1 - (alt - minAlt) / (maxAlt - minAlt)) * (H - PAD.top - PAD.bottom);

  const line = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${x(p.km).toFixed(1)},${y(p.alt).toFixed(1)}`,
    )
    .join(" ");
  const area = `${line} L${x(totalKm).toFixed(1)},${y(minAlt)} L${x(0).toFixed(1)},${y(minAlt)} Z`;

  const gridAlts: number[] = [];
  for (let a = minAlt; a <= maxAlt; a += 500) gridAlts.push(a);

  const peak = points.reduce((a, b) => (b.alt > a.alt ? b : a));
  const peakMark = marks.reduce((a, b) =>
    Math.abs(b.km - peak.km) < Math.abs(a.km - peak.km) ? b : a,
  );

  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Profil de dénivelé de l'étape"
        className="w-full"
      >
        {gridAlts.map((a) => (
          <g key={a}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(a)}
              y2={y(a)}
              stroke="#EAEAEA"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 8}
              y={y(a) + 3}
              textAnchor="end"
              fontSize="10"
              fill="#787774"
              fontFamily="var(--font-geist-mono)"
            >
              {a}
            </text>
          </g>
        ))}
        <path d={area} fill="#2F3437" opacity="0.06" />
        <path d={line} fill="none" stroke="#2F3437" strokeWidth="1.5" />
        {marks.map((m) => (
          <circle
            key={`${m.name}-${m.km}`}
            cx={x(m.km)}
            cy={y(m.alt)}
            r="3"
            fill="#F7F6F3"
            stroke="#2F3437"
            strokeWidth="1.5"
          >
            <title>{`${m.name} — ${Math.round(m.alt)} m (km ${m.km.toFixed(1)})`}</title>
          </circle>
        ))}
        <text
          x={Math.min(Math.max(x(peak.km), 90), W - 90)}
          y={y(peak.alt) - 10}
          textAnchor="middle"
          fontSize="10"
          fill="#2F3437"
          fontFamily="var(--font-geist-mono)"
        >
          {`${peakMark.name} · ${Math.round(peak.alt)} m`}
        </text>
        <text
          x={PAD.left}
          y={H - 10}
          fontSize="10"
          fill="#787774"
          fontFamily="var(--font-geist-mono)"
        >
          0 km
        </text>
        <text
          x={W - PAD.right}
          y={H - 10}
          textAnchor="end"
          fontSize="10"
          fill="#787774"
          fontFamily="var(--font-geist-mono)"
        >
          {totalKm.toFixed(totalKm < 30 ? 1 : 0)} km
        </text>
      </svg>
      <figcaption className="mt-1 text-xs text-muted">{caption}</figcaption>
    </figure>
  );
}
