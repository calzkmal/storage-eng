"use client";

type Props = {
  done: number;
  total: number;
  size?: number;
  stroke?: number;
  /** Shown in the middle. Defaults to the finished count. */
  center?: string;
  label: string;
};

const TRACK = "#e2e8f0";
const DONE = "#10b981";
const PARTIAL = "#0ea5e9";

export default function ProgressRing({ done, total, size = 56, stroke = 6, center, label }: Props) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = total > 0 ? Math.min(done / total, 1) : 0;
  const mid = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      <circle cx={mid} cy={mid} r={radius} fill="none" stroke={TRACK} strokeWidth={stroke} />
      {fraction > 0 && (
        <circle
          cx={mid}
          cy={mid}
          r={radius}
          fill="none"
          stroke={fraction >= 1 ? DONE : PARTIAL}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference * fraction} ${circumference}`}
          transform={`rotate(-90 ${mid} ${mid})`}
        />
      )}
      <text
        x={mid}
        y={mid}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.3}
        fontWeight={700}
        fill={fraction >= 1 ? DONE : "#334155"}
      >
        {center ?? done}
      </text>
    </svg>
  );
}
