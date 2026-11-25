// FILE: frontend/src/components/RiskGauge.js
import React from "react";
import { getRiskColor, getRiskBadgeClass, getRiskEmoji } from "../utils/helpers";

export default function RiskGauge({ score = 0, level = "Low", size = "md" }) {
  const color   = getRiskColor(score);
  const radius  = size === "lg" ? 55 : 40;
  const stroke  = size === "lg" ? 8  : 6;
  const circ    = 2 * Math.PI * radius;
  const pct     = Math.min(Math.max(score, 0), 100) / 100;
  const dash    = circ * pct;
  const svgSize = (radius + stroke) * 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
      <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        {/* Track */}
        <circle
          cx={svgSize / 2} cy={svgSize / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          cx={svgSize / 2} cy={svgSize / 2} r={radius}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
          style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: "stroke-dasharray 0.8s ease" }}
        />
        {/* Score text */}
        <text
          x={svgSize / 2} y={svgSize / 2 - 4}
          textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize={size === "lg" ? "18" : "14"}
          fontFamily="var(--font-display)" fontWeight="700"
        >
          {Math.round(score)}
        </text>
        <text
          x={svgSize / 2} y={svgSize / 2 + (size === "lg" ? 16 : 12)}
          textAnchor="middle"
          fill="var(--text-secondary)" fontSize={size === "lg" ? "9" : "8"}
          fontFamily="var(--font-body)"
        >
          / 100
        </text>
      </svg>
      <div>
        <span className={getRiskBadgeClass(level)}>
          {getRiskEmoji(level)} {level} Risk
        </span>
      </div>
    </div>
  );
}
