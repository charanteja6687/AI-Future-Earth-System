// FILE: frontend/src/components/TrendChart.js
import React from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

const COLORS = {
  temperature: "#ef4444",
  aqi:         "#f97316",
  water:       "#3b82f6",
  forest:      "#22c55e",
  risk_score:  "#a855f7",
};

const DOMAINS = {
  temperature: [-10,  60],
  aqi:         [  0, 500],
  water:       [  0, 100],
  forest:      [  0, 100],
  risk_score:  [  0, 100],
};

const UNITS = {
  temperature: "°C",
  aqi:         "",
  water:       "%",
  forest:      "%",
  risk_score:  "/100",
};

function sanitiseValue(metric, val) {
  const v = parseFloat(val);
  if (isNaN(v)) return null;
  const [lo, hi] = DOMAINS[metric] || [0, 100];
  return Math.min(Math.max(v, lo), hi);
}

const CustomTooltip = ({ active, payload, label, metric }) => {
  if (!active || !payload?.length) return null;
  const unit = UNITS[metric] || "";
  return (
    <div style={{
      background:"var(--bg-secondary)", border:"1px solid var(--border)",
      borderRadius:"var(--radius-sm)", padding:"0.6rem 0.9rem", fontSize:"0.78rem",
    }}>
      <div style={{ color:"var(--text-secondary)", marginBottom:"0.3rem", fontWeight:700 }}>Year {label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color:p.color, display:"flex", gap:"0.5rem", justifyContent:"space-between" }}>
          <span>{p.name}:</span>
          <b>{typeof p.value === "number" ? `${p.value.toFixed(1)}${unit}` : "—"}</b>
        </div>
      ))}
    </div>
  );
};

// ── Main TrendChart ───────────────────────────────────────────────────────────
// Props:
//   historical : array of {year, [metric]} from backend
//   predicted  : array of {year, [metric]} from backend
//   simulated  : array of {year, [metric]} — dynamic simulation overlay (optional)
//   metric     : which metric to plot
//   height     : chart height in px
export default function TrendChart({
  historical  = [],
  predicted   = [],
  simulated   = [],   // NEW — simulation time-series overlay
  metric      = "temperature",
  height      = 200,
}) {
  // Build merged map: { year, historical?, predicted?, simulated? }
  const map = {};

  historical.forEach(r => {
    const yr = parseInt(r.year);
    const v  = sanitiseValue(metric, r[metric]);
    if (!map[yr]) map[yr] = { year: yr };
    if (v !== null) map[yr].historical = v;
  });

  predicted.forEach(r => {
    const yr = parseInt(r.year);
    const v  = sanitiseValue(metric, r[metric]);
    if (!map[yr]) map[yr] = { year: yr };
    if (v !== null) map[yr].predicted = v;
  });

  // Simulated line — override predicted years with simulation values
  simulated.forEach(r => {
    const yr = parseInt(r.year);
    const v  = sanitiseValue(metric, r[metric]);
    if (!map[yr]) map[yr] = { year: yr };
    if (v !== null) map[yr].simulated = v;
  });

  const merged = Object.values(map).sort((a, b) => a.year - b.year);

  const color  = COLORS[metric] || "#00d4ff";
  const domain = DOMAINS[metric] || [0, 100];
  const unit   = UNITS[metric]   || "";
  const pad    = (domain[1] - domain[0]) * 0.08;
  const yMin   = +(domain[0] - pad).toFixed(1);
  const yMax   = +(domain[1] + pad).toFixed(1);
  const tickInterval = Math.max(1, Math.floor(merged.length / 7));
  const hasSimulation = simulated.length > 0;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={merged} margin={{ top:8, right:12, left:-5, bottom:0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />

        <XAxis
          dataKey="year"
          tick={{ fill:"var(--text-secondary)", fontSize:10 }}
          tickLine={false}
          interval={tickInterval}
        />

        <YAxis
          domain={[yMin, yMax]}
          tick={{ fill:"var(--text-secondary)", fontSize:10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `${v}${unit}`}
          width={unit ? 42 : 30}
        />

        <Tooltip content={<CustomTooltip metric={metric} />} />

        <Legend
        iconType="plainline"
          wrapperStyle={{ fontSize:"0.72rem", paddingTop:"0.5rem" }}
          formatter={v => <span style={{ color:"var(--text-secondary)" }}>{v}</span>}
        />

        <ReferenceLine
          x={2024}
          stroke="rgba(255,255,255,0.2)"
          strokeDasharray="4 4"
          label={{ value:"2024", fill:"var(--text-muted)", fontSize:9 }}
        />

        {/* Historical — solid */}
        <Line
          type="monotone" dataKey="historical"
          name="Historical (2010–2024)"
          stroke={color} dot={false} strokeWidth={2} connectNulls={false}
        />

        {/* Predicted — dashed */}
        <Line
          type="monotone" dataKey="predicted"
          name="Predicted (2025–)"
          stroke={color} dot={false} strokeWidth={2}
          strokeDasharray="5 3" strokeOpacity={0.65}
          connectNulls={false}
        />

        {/* Simulated — bright solid different colour, only when simulation ran */}
        {hasSimulation && (
          <Line
            type="monotone" dataKey="simulated"
            name="With Simulation"
            stroke="#00ff88" dot={false} strokeWidth={2.5}
            strokeDasharray="0" strokeOpacity={1}
            connectNulls={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}