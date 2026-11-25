// FILE: frontend/src/pages/Scenarios.js
import React from "react";
import { useApp } from "../context/AppContext";
import LoadingOverlay from "../components/LoadingOverlay";
import { getRiskColor } from "../utils/helpers";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import "./Scenarios.css";

const tooltipStyle = {
  contentStyle: {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    fontSize: "0.78rem",
  },
};

// Shorten labels so all 4 fit on X-axis without overlapping
function shortLabel(label) {
  if (!label) return "—";
  if (label.includes("No Action"))   return "No Action";
  if (label.includes("Pollution"))   return "Pollution Ctrl";
  if (label.includes("Green"))       return "Green Init.";
  if (label.includes("Sustainable")) return "Sustainable";
  return label.split(" ").slice(0, 2).join(" ");
}

export default function Scenarios() {
  const { prediction, report, loading } = useApp();
  const scenarios = report?.scenarios || [];

  // All 5 metrics + shortened label
  const chartData = scenarios.map(sc => ({
    name:        shortLabel(sc.label),
    risk:        sc.risk_score   != null ? +sc.risk_score.toFixed(1)  : 0,
    temperature: sc.temperature  != null ? +sc.temperature.toFixed(1) : 0,
    aqi:         sc.aqi          != null ? +sc.aqi.toFixed(0)         : 0,
    water:       sc.water        != null ? +sc.water.toFixed(0)       : 0,
    forest:      sc.forest       != null ? +sc.forest.toFixed(0)      : 0,
  }));

  if (loading) return <LoadingOverlay />;

  if (!prediction || scenarios.length === 0) {
    return (
      <div className="scenarios-page">
        <div className="page-title">🔀 Scenarios</div>
        <div className="section-card" style={{ textAlign:"center", padding:"3rem", color:"var(--text-secondary)" }}>
          <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>🔀</div>
          <div style={{ fontSize:"1rem", fontWeight:600, marginBottom:"0.5rem" }}>No Simulation Data Available</div>
          <div style={{ fontSize:"0.85rem" }}>Please run a simulation first.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="scenarios-page">
      <div className="page-title">🔀 Scenarios</div>
      <div className="page-subtitle">Simulation Results</div>

      {/* Scenario Comparison Table */}
      <div className="section-card" style={{ marginBottom:"1rem" }}>
        <div className="section-card-header">
          <span className="section-card-title">📋 SCENARIO COMPARISON</span>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table className="scenarios-table">
            <thead>
              <tr>
                <th>Scenario</th>
                <th>Temp (°C)</th>
                <th>AQI</th>
                <th>Water (%)</th>
                <th>Forest (%)</th>
                <th>Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((sc, i) => (
                <tr key={i}>
                  <td>{sc.label}</td>
                  <td style={{ color:"var(--risk-high)"     }}>{sc.temperature?.toFixed(1) || "—"}</td>
                  <td style={{ color:"var(--accent-orange)" }}>{sc.aqi?.toFixed(0)          || "—"}</td>
                  <td style={{ color:"var(--accent-blue)"   }}>{sc.water?.toFixed(0)         || "—"}</td>
                  <td style={{ color:"var(--risk-low)"      }}>{sc.forest?.toFixed(0)        || "—"}</td>
                  <td>
                    {sc.risk_score != null ? (
                      <span style={{ color:getRiskColor(sc.risk_score), fontWeight:700 }}>
                        {sc.risk_score.toFixed(0)} ({sc.risk_level || "—"})
                      </span>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4 Charts — 2x2 grid */}
      <div className="grid-2" style={{ gap:"1rem" }}>

        {/* Chart 1 — Risk Score */}
        <div className="section-card">
          <div className="section-card-header">
            <span className="section-card-title">📊 Risk Score</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top:5, right:10, left:-10, bottom:30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="name"
                tick={{ fill:"var(--text-secondary)", fontSize:11 }}
                tickLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis domain={[0,100]} tick={{ fill:"var(--text-secondary)", fontSize:10 }} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="risk" name="Risk Score" fill="var(--accent-purple)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2 — Temperature */}
        <div className="section-card">
          <div className="section-card-header">
            <span className="section-card-title">🌡️ Temperature (°C)</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top:5, right:10, left:-10, bottom:30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="name"
                tick={{ fill:"var(--text-secondary)", fontSize:11 }}
                tickLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis domain={[0,50]} tick={{ fill:"var(--text-secondary)", fontSize:10 }} tickLine={false} axisLine={false}
                tickFormatter={v => `${v}°`} />
              <Tooltip {...tooltipStyle} formatter={v => [`${v}°C`, "Temperature"]} />
              <Bar dataKey="temperature" name="Temp (°C)" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 3 — Water & AQI */}
        <div className="section-card">
          <div className="section-card-header">
            <span className="section-card-title">💧 Water &amp; AQI</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top:5, right:10, left:-10, bottom:30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="name"
                tick={{ fill:"var(--text-secondary)", fontSize:11 }}
                tickLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis tick={{ fill:"var(--text-secondary)", fontSize:10 }} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize:"0.72rem" }} />
              <Bar dataKey="water" name="Water (%)" fill="#00d4ff" radius={[4,4,0,0]} />
              <Bar dataKey="aqi"   name="AQI"       fill="#f97316" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 4 — Forest Cover */}
        <div className="section-card">
          <div className="section-card-header">
            <span className="section-card-title">🌳 Forest Cover (%)</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top:5, right:10, left:-10, bottom:30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="name"
                tick={{ fill:"var(--text-secondary)", fontSize:11 }}
                tickLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis domain={[0,100]} tick={{ fill:"var(--text-secondary)", fontSize:10 }} tickLine={false} axisLine={false}
                tickFormatter={v => `${v}%`} />
              <Tooltip {...tooltipStyle} formatter={v => [`${v}%`, "Forest Cover"]} />
              <Bar dataKey="forest" name="Forest (%)" fill="#22c55e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}