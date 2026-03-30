"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartProps {
  data: { date: string; count: number }[];
  title: string;
}

// Chart layout constants
const CHART_HEIGHT = 260;
const PADDING = { top: 16, right: 16, bottom: 28, left: 44 };
const GRADIENT_ID = "area-gradient";

/**
 * Attempt to compute a monotone cubic spline (Catmull-Rom variant used by
 * Recharts "monotone" type). Falls back to simple line segments for <=2 points.
 */
function buildSplinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;

  if (points.length === 2) {
    return `M${points[0].x},${points[0].y}L${points[1].x},${points[1].y}`;
  }

  // Monotone cubic Hermite interpolation (Fritsch-Carlson)
  const n = points.length;
  const dx: number[] = [];
  const dy: number[] = [];
  const m: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1].x - points[i].x);
    dy.push(points[i + 1].y - points[i].y);
    m.push(dy[i] / dx[i]);
  }

  const tangents: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) {
      tangents.push(0);
    } else {
      tangents.push((m[i - 1] + m[i]) / 2);
    }
  }
  tangents.push(m[n - 2]);

  // Fritsch-Carlson monotonicity constraint
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(m[i]) < 1e-10) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
    } else {
      const alpha = tangents[i] / m[i];
      const beta = tangents[i + 1] / m[i];
      const s = alpha * alpha + beta * beta;
      if (s > 9) {
        const tau = 3 / Math.sqrt(s);
        tangents[i] = tau * alpha * m[i];
        tangents[i + 1] = tau * beta * m[i];
      }
    }
  }

  let path = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const seg = dx[i] / 3;
    const cp1x = points[i].x + seg;
    const cp1y = points[i].y + tangents[i] * seg;
    const cp2x = points[i + 1].x - seg;
    const cp2y = points[i + 1].y - tangents[i + 1] * seg;
    path += `C${cp1x},${cp1y},${cp2x},${cp2y},${points[i + 1].x},${points[i + 1].y}`;
  }

  return path;
}

function computeNiceTicks(maxVal: number): number[] {
  if (maxVal <= 0) return [0];
  const rawStep = maxVal / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const candidates = [1, 2, 5, 10];
  const step = candidates.find((c) => c * mag >= rawStep)! * mag;
  const ticks: number[] = [];
  for (let v = 0; v <= maxVal + step * 0.01; v += step) {
    ticks.push(Math.round(v * 1000) / 1000);
  }
  // Ensure we have at least the max
  if (ticks[ticks.length - 1] < maxVal) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

export const NegotiationsChart = memo(function NegotiationsChart({
  data,
  title,
}: ChartProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    idx: number;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Нет данных для графика
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const yTicks = computeNiceTicks(maxCount);
  const yMax = yTicks[yTicks.length - 1];

  // Use a wide enough viewBox; the SVG will scale responsively
  const viewBoxWidth = 720;
  const plotW = viewBoxWidth - PADDING.left - PADDING.right;
  const plotH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  // Map data to pixel coords within plot area
  const points = data.map((d, i) => ({
    x: PADDING.left + (i / (data.length - 1)) * plotW,
    y: PADDING.top + plotH - (d.count / yMax) * plotH,
  }));

  const linePath = buildSplinePath(points);
  // Area path: line path + close along the bottom
  const areaPath = `${linePath}L${points[points.length - 1].x},${PADDING.top + plotH}L${points[0].x},${PADDING.top + plotH}Z`;

  // Show every Nth label to avoid clutter
  const labelEvery = data.length <= 15 ? 1 : Math.ceil(data.length / 10);

  // Grid lines for Y
  const gridLines = yTicks.map((v) => ({
    y: PADDING.top + plotH - (v / yMax) * plotH,
    label: String(v),
  }));

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const xRatio = (e.clientX - rect.left) / rect.width;
      const xInViewBox = xRatio * viewBoxWidth;
      // Find nearest data point
      let nearest = 0;
      let minDist = Infinity;
      for (let i = 0; i < points.length; i++) {
        const dist = Math.abs(points[i].x - xInViewBox);
        if (dist < minDist) {
          minDist = dist;
          nearest = i;
        }
      }
      setTooltip({ x: points[nearest].x, y: points[nearest].y, idx: nearest });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="relative pb-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewBoxWidth} ${CHART_HEIGHT}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          role="img"
          aria-label={title}
        >
          <defs>
            <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--primary)"
                stopOpacity={0.2}
              />
              <stop
                offset="100%"
                stopColor="var(--primary)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((g, i) => (
            <g key={i}>
              <line
                x1={PADDING.left}
                x2={viewBoxWidth - PADDING.right}
                y1={g.y}
                y2={g.y}
                stroke="var(--border)"
                strokeOpacity={0.5}
                strokeDasharray="3 3"
              />
              <text
                x={PADDING.left - 8}
                y={g.y + 4}
                textAnchor="end"
                fill="var(--muted-foreground)"
                fontSize={11}
              >
                {g.label}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {data.map((d, i) =>
            i % labelEvery === 0 || i === data.length - 1 ? (
              <text
                key={i}
                x={points[i].x}
                y={CHART_HEIGHT - 4}
                textAnchor="middle"
                fill="var(--muted-foreground)"
                fontSize={11}
              >
                {d.date}
              </text>
            ) : null,
          )}

          {/* Area fill */}
          <path d={areaPath} fill={`url(#${GRADIENT_ID})`} />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Hover cursor line */}
          {tooltip && (
            <line
              x1={tooltip.x}
              x2={tooltip.x}
              y1={PADDING.top}
              y2={PADDING.top + plotH}
              stroke="var(--primary)"
              strokeWidth={1}
              strokeDasharray="4 4"
              strokeOpacity={0.6}
            />
          )}

          {/* Active dot */}
          {tooltip && (
            <g>
              <circle
                cx={tooltip.x}
                cy={tooltip.y}
                r={5}
                fill="var(--primary)"
                stroke="var(--card)"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>

        {/* Tooltip overlay (positioned via CSS) */}
        {tooltip && (
          <ChartTooltip
            date={data[tooltip.idx].date}
            count={data[tooltip.idx].count}
            svgRef={svgRef}
            xInViewBox={tooltip.x}
            viewBoxWidth={viewBoxWidth}
          />
        )}
      </CardContent>
    </Card>
  );
});

/** CSS-positioned tooltip that appears near the hovered point. */
function ChartTooltip({
  date,
  count,
  svgRef,
  xInViewBox,
  viewBoxWidth,
}: {
  date: string;
  count: number;
  svgRef: React.RefObject<SVGSVGElement | null>;
  xInViewBox: number;
  viewBoxWidth: number;
}) {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const xPct = xInViewBox / viewBoxWidth;
    const left = rect.left + xPct * rect.width;
    // Place tooltip near the top of the chart
    const top = rect.top + 16;
    setPos({ left, top });
  }, [svgRef, xInViewBox, viewBoxWidth]);

  if (!pos) return null;

  // Flip tooltip if too close to the right edge
  const flip = xInViewBox / viewBoxWidth > 0.75;

  return (
    <div
      ref={tooltipRef}
      className="pointer-events-none fixed z-50 rounded-[10px] border border-border bg-popover px-3 py-2 text-popover-foreground shadow-lg"
      style={{
        left: pos.left,
        top: pos.top,
        transform: flip ? "translateX(-100%)" : "translateX(-50%)",
        fontSize: 13,
      }}
    >
      <div className="mb-1 text-muted-foreground">{date}</div>
      <div className="font-medium" style={{ color: "var(--primary)" }}>
        Откликов: {count}
      </div>
    </div>
  );
}
