import { formatShortDate } from "@/lib/utils/analytics";

export interface ChartPoint {
  date: string;  // YYYY-MM-DD
  value: number;
}

interface LineChartProps {
  data: ChartPoint[];
  unit?: string;
  color?: string;
  gradientId: string; // unique per chart instance to avoid SVG id collision
}

export function LineChart({
  data,
  unit = "",
  color = "#6366f1",
  gradientId,
}: LineChartProps) {
  if (data.length < 2) {
    return (
      <p className="text-sm text-muted text-center py-6">
        Necesitas al menos 2 sesiones para ver la gráfica.
      </p>
    );
  }

  const W = 320;
  const H = 130;
  const PAD = { top: 18, right: 12, bottom: 28, left: 40 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const vals = data.map((d) => d.value);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const spread = maxV - minV || 1;
  const yMin = minV - spread * 0.12;
  const yMax = maxV + spread * 0.12;
  const yRange = yMax - yMin;

  const px = (i: number) =>
    PAD.left + (i / (data.length - 1)) * cW;
  const py = (v: number) =>
    PAD.top + cH - ((v - yMin) / yRange) * cH;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${px(i).toFixed(1)} ${py(d.value).toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L ${px(data.length - 1).toFixed(1)} ${(PAD.top + cH).toFixed(1)} L ${px(0).toFixed(1)} ${(PAD.top + cH).toFixed(1)} Z`;

  // Y-axis: 3 evenly distributed labels
  const yTicks = [minV, (minV + maxV) / 2, maxV];

  // X-axis: first, middle, last
  const xIndices =
    data.length >= 3
      ? [0, Math.floor((data.length - 1) / 2), data.length - 1]
      : [0, data.length - 1];
  const xTicks = Array.from(new Set(xIndices));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      aria-label="Gráfica de progresión"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Horizontal grid lines */}
      {yTicks.map((v, i) => (
        <line
          key={i}
          x1={PAD.left}
          y1={py(v).toFixed(1)}
          x2={PAD.left + cW}
          y2={py(v).toFixed(1)}
          stroke="rgb(63 63 70 / 0.6)"
          strokeWidth="0.5"
          strokeDasharray="3 3"
        />
      ))}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={px(i).toFixed(1)}
          cy={py(d.value).toFixed(1)}
          r="2.5"
          fill={color}
          stroke="rgb(9 9 11)"
          strokeWidth="1"
        />
      ))}

      {/* Y-axis labels */}
      {yTicks.map((v, i) => (
        <text
          key={i}
          x={PAD.left - 5}
          y={(py(v) + 3.5).toFixed(1)}
          textAnchor="end"
          fontSize="9"
          fill="rgb(113 113 122)"
        >
          {Math.round(v)}
          {unit}
        </text>
      ))}

      {/* X-axis labels */}
      {xTicks.map((idx) => (
        <text
          key={idx}
          x={px(idx).toFixed(1)}
          y={H - 4}
          textAnchor={idx === 0 ? "start" : idx === data.length - 1 ? "end" : "middle"}
          fontSize="9"
          fill="rgb(113 113 122)"
        >
          {formatShortDate(data[idx].date)}
        </text>
      ))}
    </svg>
  );
}
