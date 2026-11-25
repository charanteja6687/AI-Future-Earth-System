import React from "react";
import { useApp } from "../context/AppContext";
import MapView from "../components/MapView";
import LoadingOverlay from "../components/LoadingOverlay";

export default function MapPage() {
  const { country, state, year, prediction, simResult, loading } = useApp();

  return (
    <div style={{ height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
      {loading && <LoadingOverlay />}
      <div
        className="section-card"
        style={{ flex: 1, padding: 0, overflow: "hidden", minHeight: 0 }}
      >
        <MapView
          country={country}
          state={state}
          prediction={prediction}
          simResult={simResult}
          year={year}
        />
      </div>
    </div>
  );
}