// FILE: frontend/src/components/MetricCard.js
import React from "react";

export default function MetricCard({ icon, label, value, unit, sub, subColor, tooltip }) {
  return (
    <div className="metric-card tooltip-wrapper" style={{ position: "relative" }}>
      {tooltip && <span className="tooltip-text">{tooltip}</span>}
      <div style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>{icon}</div>
      <div className="metric-value" style={{ color: subColor || "#ffffffa2"}}>
        {value !== null && value !== undefined ? value : "—"}
        {unit && <span style={{ fontSize: "0.75rem", marginLeft: "2px", color: "var(--text-secondary)" }}>{unit}</span>}
      </div>
      <div className="metric-label">{label}</div>
      {sub && (
        <div className="metric-sub" style={{ color: subColor || "#ffffff9b" }}>{sub}</div>
      )}
    </div>
  );
}
