// FILE: frontend/src/components/LoadingOverlay.js
import React from "react";

export default function LoadingOverlay({ message = "AI is thinking..." }) {
  return (
    <div className="loading-overlay">
      <div className="spinner"></div>
      <div style={{ color: "var(--accent-green)", fontFamily: "var(--font-display)", fontSize: "0.9rem", letterSpacing: "0.1em" }}>
        {message}
      </div>
      <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
        Running environmental prediction models…
      </div>
    </div>
  );
}
