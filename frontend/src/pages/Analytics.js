import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import TrendChart from "../components/TrendChart";
import LoadingOverlay from "../components/LoadingOverlay";
import { getRiskColor, clamp } from "../utils/helpers";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import "./Analytics.css";

const METRICS = [
  { key: "temperature", label: "Temperature (°C)", color: "#ef4444", icon: "🌡️" },
  { key: "aqi",         label: "AQI",              color: "#f97316", icon: "🌫️" },
  { key: "water",       label: "Water (%)",         color: "#3b82f6", icon: "💧" },
  { key: "forest",      label: "Forest (%)",        color: "#22c55e", icon: "🌳" },
  { key: "risk_score",  label: "Risk Score",        color: "#a855f7", icon: "⚠️" },
];

const MINI_METRICS = [
  { key: "temperature", label: "Temperature (°C)", sub: "0–50°C scale"  },
  { key: "aqi",         label: "AQI",              sub: "0–500 scale"   },
  { key: "water",       label: "Water (%)",         sub: "0–100% scale" },
  { key: "forest",      label: "Forest (%)",        sub: "0–100% scale" },
];

const SUMMARY_ROWS = [
  { icon: "🌡️", label: "Temperature", key: "temperature", unit: "°C", range: "0–50°C",  color: "var(--risk-high)"      },
  { icon: "🌫️", label: "AQI",         key: "aqi",         unit: "",   range: "0–500",   color: "var(--accent-orange)"  },
  { icon: "💧", label: "Water",        key: "water",       unit: "%",  range: "0–100%",  color: "var(--accent-blue)"    },
  { icon: "🌳", label: "Forest",       key: "forest",      unit: "%",  range: "0–100%",  color: "var(--risk-low)"       },
];

const WEIGHTS = { temperature: "25%", aqi: "30%", water: "20%", forest: "25%" };

function normaliseForRadar(metric, value) {
  const v = parseFloat(value);
  if (isNaN(v)) return 0;
  switch (metric) {
    case "temperature": return +clamp(((v - (-10)) / 70) * 100, 0, 100).toFixed(1);
    case "aqi":         return +clamp((v / 500) * 100, 0, 100).toFixed(1);
    case "water":       return +clamp(100 - v, 0, 100).toFixed(1);
    case "forest":      return +clamp(100 - v, 0, 100).toFixed(1);
    default:            return +clamp(v, 0, 100).toFixed(1);
  }
}

function buildSimTimeSeries(predicted, simResult, baseResult) {
  if (!simResult || !predicted || predicted.length === 0) return [];
  const total = predicted.length;
  return predicted.map((row, i) => {
    const progress = (i + 1) / total;
    function interp(baseVal, simVal) {
      const b = parseFloat(baseVal) || 0;
      const s = parseFloat(simVal)  || 0;
      return b + (s - b) * progress;
    }
    const t  = interp(row.temperature, simResult.temperature);
    const a  = interp(row.aqi,         simResult.aqi);
    const w  = interp(row.water,       simResult.water);
    const f  = interp(row.forest,      simResult.forest);
    const tN = clamp(t / 50,  0, 1) * 100;
    const aN = clamp(a / 500, 0, 1) * 100;
    const wI = 100 - clamp(w, 0, 100);
    const fI = 100 - clamp(f, 0, 100);
    const rs = clamp(tN * 0.25 + aN * 0.30 + wI * 0.20 + fI * 0.25, 0, 100);
    return {
      year:        parseInt(row.year),
      temperature: +t.toFixed(2),
      aqi:         +a.toFixed(1),
      water:       +w.toFixed(2),
      forest:      +f.toFixed(2),
      risk_score:  +rs.toFixed(2),
    };
  });
}

const tooltipStyle = {
  contentStyle: {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    fontSize: "0.78rem",
  },
};

export default function Analytics() {
  const { prediction, trendData, simResult, simFactors, loading } = useApp();
  const [activeMetric, setActiveMetric] = useState("temperature");

  const p = prediction;
  const t = trendData;
  const s = simResult;

  const simTimeSeries = useMemo(() => {
    if (!s || !t?.predicted || !p) return [];
    return buildSimTimeSeries(t.predicted, s, p);
  }, [s, t, p, simFactors]);

  const activeData = s || p;

  const radarData = useMemo(() => {
    if (!activeData) return [];
    return [
      { subject: "Temp Risk",   value: normaliseForRadar("temperature", activeData.temperature) },
      { subject: "AQI Risk",    value: normaliseForRadar("aqi",         activeData.aqi)         },
      { subject: "Water Risk",  value: normaliseForRadar("water",       activeData.water)        },
      { subject: "Forest Risk", value: normaliseForRadar("forest",      activeData.forest)       },
      { subject: "Overall",     value: +clamp(activeData.risk_score, 0, 100).toFixed(1)          },
    ];
  }, [activeData]);

  const radarBefore = useMemo(() => {
    if (!p) return [];
    return [
      { subject: "Temp Risk",   value: normaliseForRadar("temperature", p.temperature) },
      { subject: "AQI Risk",    value: normaliseForRadar("aqi",         p.aqi)         },
      { subject: "Water Risk",  value: normaliseForRadar("water",       p.water)        },
      { subject: "Forest Risk", value: normaliseForRadar("forest",      p.forest)       },
      { subject: "Overall",     value: +clamp(p.risk_score, 0, 100).toFixed(1)          },
    ];
  }, [p]);

  return (
    <div className="analytics">
      {loading && <LoadingOverlay />}

      <div className="page-title">📈 Analytics</div>
      <div className="page-subtitle">
        Environmental metrics and trends
        {s && (
          <span style={{ marginLeft: "1rem", fontSize: "0.75rem", color: "#00ff88", fontWeight: 700 }}>
            🎮 Simulation overlay active
          </span>
        )}
      </div>

      {/* Metric tabs */}
      {t && (
        <div className="section-card" style={{ marginBottom: "1rem" }}>
          <div className="metric-tabs">
            {METRICS.map(m => (
              <button
                key={m.key}
                className={"metric-tab" + (activeMetric === m.key ? " active" : "")}
                onClick={() => setActiveMetric(m.key)}
                style={activeMetric === m.key ? { borderColor: m.color, color: m.color } : {}}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main trend chart */}
      {t && (
        <div className="section-card" style={{ marginBottom: "1rem" }}>
          <div className="section-card-header">
            <span className="section-card-title">
              {METRICS.find(m => m.key === activeMetric)?.icon}{" "}
              {METRICS.find(m => m.key === activeMetric)?.label}
              {simTimeSeries.length > 0 ? " — Historical vs Predicted vs Simulated" : " — Historical vs Predicted"}
            </span>
          </div>
          <TrendChart
            historical={t.historical}
            predicted={t.predicted}
            simulated={simTimeSeries}
            metric={activeMetric}
            height={250}
          />
          {simTimeSeries.length > 0 && (
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
              🟢 Green line = simulation result
            </div>
          )}
        </div>
      )}

      {/* Mini charts + Radar */}
      <div className="analytics-grid">
        {t && MINI_METRICS.map(m => (
          <div key={m.key} className="section-card">
            <div className="section-card-header">
              <span className="section-card-title">
                {METRICS.find(x => x.key === m.key)?.icon} {m.label}
              </span>
              <span className="section-card-sub">{m.sub}</span>
            </div>
            <TrendChart
              historical={t.historical}
              predicted={t.predicted}
              simulated={simTimeSeries}
              metric={m.key}
              height={150}
            />
          </div>
        ))}

        {activeData && (
          <div className="section-card">
            <div className="section-card-header">
              <span className="section-card-title">🕸️ Risk Profile Radar</span>
              <span className="section-card-sub">{s ? "Prediction vs Simulation" : "All axes 0–100"}</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tickCount={5} tick={{ fill: "var(--text-muted)", fontSize: 8 }} />
                {s && (
                  <Radar
                    name="AI Prediction"
                    dataKey="value"
                    data={radarBefore}
                    stroke="rgba(255, 255, 255, 0.5)"
                    fill="rgba(255, 255, 255, 0.5)"
                    fillOpacity={0.3}
                    dot={false}
                  />
                )}
                <Radar
                  name={s ? "With Simulation" : "Risk Level"}
                  dataKey="value"
                  stroke={s ? "#00ff88" : "var(--accent-green)"}
                  fill={s ? "#00ff88" : "var(--accent-green)"}
                  fillOpacity={0.25}
                  dot={{ fill: s ? "#00ff88" : "var(--accent-green)", r: 3 }}
                />
                <Tooltip {...tooltipStyle} formatter={(v, n) => [`${v}/100`, n]} />
                <Legend wrapperStyle={{ fontSize: "0.72rem" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Summary table */}
      {p && (
        <div className="section-card" style={{ marginTop: "1rem" }}>
          <div className="section-card-header">
            <span className="section-card-title">
              📋 {s ? "Prediction vs Simulation" : "Prediction Summary"}
            </span>
          </div>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>AI Prediction</th>
                {s && <th>After Simulation</th>}
                {s && <th>Change</th>}
                <th>Valid Range</th>
                <th>Weight</th>
              </tr>
            </thead>
            <tbody>
              {SUMMARY_ROWS.map(row => {
                const bv   = p[row.key];
                const sv   = s?.[row.key];
                const diff = sv != null ? sv - bv : null;
                const lowerBetter = row.key === "temperature" || row.key === "aqi";
                const isGood = diff == null ? null : lowerBetter ? diff < 0 : diff > 0;
                return (
                  <tr key={row.key}>
                    <td>{row.icon} {row.label}</td>
                    <td style={{ color: row.color, fontWeight: 700 }}>{bv?.toFixed(2)} {row.unit}</td>
                    {s && (
                      <td style={{ color: isGood ? "var(--risk-low)" : "var(--risk-high)", fontWeight: 700 }}>
                        {sv?.toFixed(2)} {row.unit}
                      </td>
                    )}
                    {s && diff != null && (
                      <td style={{ color: isGood ? "var(--risk-low)" : "var(--risk-high)", fontWeight: 700 }}>
                        {diff > 0 ? "+" : ""}{diff.toFixed(2)} {row.unit}
                      </td>
                    )}
                    <td style={{ color: "#f8fafc", fontSize: "0.75rem" }}>{row.range}</td>
                    <td>{WEIGHTS[row.key]}</td>
                  </tr>
                );
              })}
              <tr style={{ background: "rgba(0,255,136,0.04)" }}>
                <td><b>⚠️ Risk Score</b></td>
                <td style={{ color: getRiskColor(p.risk_score), fontWeight: 900, fontFamily: "var(--font-display)", fontSize: "1rem" }}>
                  {p.risk_score?.toFixed(2)} / 100
                </td>
                {s && (
                  <td style={{ color: getRiskColor(s.risk_score), fontWeight: 900, fontFamily: "var(--font-display)", fontSize: "1rem" }}>
                    {s.risk_score?.toFixed(2)} / 100
                  </td>
                )}
                {s && (
                  <td style={{ color: s.risk_score < p.risk_score ? "var(--risk-low)" : "var(--risk-high)", fontWeight: 700 }}>
                    {s.risk_score < p.risk_score ? "▼" : "▲"} {Math.abs(s.risk_score - p.risk_score).toFixed(2)}
                  </td>
                )}
                <td style={{ color: "#f8fafc", fontSize: "0.75rem" }}>0–100</td>
                <td>100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}