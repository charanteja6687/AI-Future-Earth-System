// FILE: frontend/src/components/MapView.js
//
// SINGLE SOURCE OF TRUTH FOR COLOUR:
// riskColor()/riskLabel() are imported from utils/helpers.js — the SAME
// function used by Simulation.js, Analytics.js, Dashboard.js, Scenarios.js.
// This file no longer defines its own local colour thresholds.
import React, { useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { COUNTRY_COORDS, STATE_COORDS, getRiskHex, getRiskLevel } from "../utils/helpers";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── FlyTo ─────────────────────────────────────────────────────────────────────
function FlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

// ── GeoJSON layer — fetches file, finds feature by name, colours it ───────────
// Re-runs whenever fillColor changes (i.e. every time simulation updates),
// so the polygon is removed and redrawn with the new colour — forcing a
// guaranteed visual re-render even if Leaflet's internal diffing would skip it.
function GeoJsonLayer({ geoUrl, matchName, fillColor, displayData, year, label }) {
  const map      = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!geoUrl || !matchName) return;

    console.log("[MapView] Redrawing polygon with colour:", fillColor, "score source:", displayData?.risk_score);

    // Always remove the old layer first — guarantees a fresh re-render
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    fetch(geoUrl)
      .then(r => r.json())
      .then(geojson => {
        const feature = geojson.features.find(f => {
          const p = f.properties || {};
          return (
            p.app_name === matchName || p.name === matchName ||
            p.NAME_1   === matchName || p.NAME_0 === matchName ||
            p.STATE    === matchName || p.state  === matchName ||
            p.COUNTRY  === matchName || p.country=== matchName
          );
        });

        if (!feature) {
          console.warn(`MapView: feature not found for "${matchName}" in ${geoUrl}`);
          return;
        }

        const layer = L.geoJSON(feature, {
          style: {
            fillColor:   fillColor,   // ← uses the LATEST colour every redraw
            fillOpacity: 0.65,
            color:       "#ffffff",
            weight:      2.5,
            opacity:     1,
          },
        });

        if (displayData) {
          const sc = displayData.risk_score ?? 0;
          layer.bindPopup(
            `<div style="font-family:sans-serif;min-width:180px;background:#0d1529;color:#e2e8f0;padding:6px 4px 4px">
              <b style="color:${fillColor};font-size:1rem">${label}</b>
              <span style="color:#94a3b8;font-size:0.75rem;margin-left:6px">• ${year}</span>
              <hr style="border:1px solid #1e3a5f;margin:6px 0"/>
              <div style="font-size:0.82rem;line-height:1.9">
                🌡️ Temp: <b>${displayData.temperature?.toFixed(1) ?? "—"}°C</b><br/>
                🌫️ AQI: <b>${displayData.aqi?.toFixed(0) ?? "—"}</b><br/>
                💧 Water: <b>${displayData.water?.toFixed(1) ?? "—"}%</b><br/>
                🌳 Forest: <b>${displayData.forest?.toFixed(1) ?? "—"}%</b>
              </div>
              <hr style="border:1px solid #1e3a5f;margin:6px 0"/>
              <div style="color:${fillColor};font-weight:800;font-size:1rem">
                ⚠️ Risk: ${sc.toFixed(0)}/100 — ${displayData.risk_level ?? getRiskLevel(sc)}
              </div>
            </div>`,
            { maxWidth: 240 }
          );
        }

        layer.addTo(map);
        layerRef.current = layer;

        try {
          map.fitBounds(layer.getBounds(), { padding:[50,50], maxZoom:8, animate:true, duration:1.0 });
        } catch (_) {}
      })
      .catch(err => console.error("GeoJSON fetch error:", err));

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  // fillColor IS a dependency — guarantees redraw whenever simulation result changes
  }, [geoUrl, matchName, fillColor, displayData, year, label, map]);

  return null;
}

// ── Main MapView ──────────────────────────────────────────────────────────────
// Props:
//   country    — e.g. "India", "USA"
//   state      — e.g. "Maharashtra" (only when country === "India")
//   prediction — AI prediction object (baseline, before simulation)
//   simResult  — simulation result object (CURRENT — overrides prediction when present)
//   year       — selected year number
export default function MapView({ country, state, prediction, simResult, year }) {
  const isIndia  = country === "India";
  const hasState = isIndia && !!state;

  // ── SINGLE SOURCE OF TRUTH ──────────────────────────────────────────────────
  // displayData ALWAYS prefers simResult. If a simulation has been run,
  // its risk_score drives the map colour — never the stale prediction.
  const displayData = simResult || prediction;
  const activeScore = displayData?.risk_score ?? 0;
  const fillColor    = getRiskHex(activeScore);
  const isSimulated  = !!simResult;
  const label        = hasState ? state : country;

  // Debug log — confirms map is receiving the latest simulation output
  useEffect(() => {
    console.log("[MapView] Props received:", {
      hasSimResult: !!simResult,
      simRiskScore: simResult?.risk_score,
      predRiskScore: prediction?.risk_score,
      activeScoreUsedForColor: activeScore,
      fillColor,
    });
  }, [simResult, prediction, activeScore, fillColor]);

  const geoUrl    = hasState ? "/geojson/india_states.geojson" : "/geojson/countries.geojson";
  const matchName = hasState ? state : country;

  const center = useMemo(() => {
    if (hasState && STATE_COORDS[state]) return STATE_COORDS[state];
    return COUNTRY_COORDS[country] || [20.5937, 78.9629];
  }, [country, state, hasState]);

  const zoom = hasState ? 6
    : isIndia ? 5
    : ["Russia","Canada","USA","Australia"].includes(country) ? 3
    : 4;

  return (
    <div style={{ height:"100%", borderRadius:"var(--radius)", overflow:"hidden", position:"relative" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height:"100%", width:"100%", background:"#0a1628" }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={0.85}
        />

        <FlyTo center={center} zoom={zoom} />

        {displayData && (
          <GeoJsonLayer
            key={`${matchName}-${activeScore}`}  // forces full remount when score changes
            geoUrl={geoUrl}
            matchName={matchName}
            fillColor={fillColor}
            displayData={displayData}
            year={year}
            label={label}
          />
        )}
      </MapContainer>

      {/* ── Top-left risk badge ── */}
      {displayData && (
        <div style={{
          position:"absolute", top:"12px", left:"12px", zIndex:1000,
          background:"rgba(10,15,30,0.94)",
          border:`2px solid ${fillColor}99`,
          borderRadius:"10px", padding:"0.6rem 1rem",
          backdropFilter:"blur(8px)",
          boxShadow:`0 0 22px ${fillColor}44`,
          minWidth:"148px",
        }}>
          <div style={{ fontSize:"0.6rem", color:"rgb(255, 255, 255)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:"2px" }}>
            {label} • {year}
          </div>
          <div style={{ fontSize:"1.5rem", fontWeight:900, color:fillColor, fontFamily:"monospace", lineHeight:1.1 }}>
            {activeScore.toFixed(0)}
            <span style={{ fontSize:"0.7rem", color:"rgba(255, 255, 255, 0.94)", fontWeight:400 }}>/100</span>
          </div>
          <div style={{ fontSize:"0.80rem", fontWeight:700, color:fillColor, marginTop:"2px" }}>
            {getRiskLevel(activeScore)} Risk
          </div>
          <div style={{
            marginTop:"6px", fontSize:"0.6rem", fontWeight:700,
            color:      isSimulated ? "#00ff88" : "#00d4ff",
            background: isSimulated ? "rgba(0,255,136,0.12)" : "rgba(0,212,255,0.12)",
            border:    `1px solid ${isSimulated ? "rgba(0,255,136,0.35)" : "rgba(0,212,255,0.35)"}`,
            borderRadius:"4px", padding:"2px 8px",
            display:"inline-block", textTransform:"uppercase", letterSpacing:"0.08em",
          }}>
            {isSimulated ? "🎮 Simulated" : "🤖 AI Prediction"}
          </div>
        </div>
      )}

      {/* ── Before / After strip ── */}
      {prediction && simResult && (
        <div style={{
          position:"absolute", top:"12px", left:"50%", transform:"translateX(-50%)",
          zIndex:1000, display:"flex", overflow:"hidden",
          borderRadius:"8px", border:"1px solid rgba(255,255,255,0.13)",
          background:"rgba(10,15,30,0.94)", backdropFilter:"blur(8px)",
          fontSize:"0.72rem", whiteSpace:"nowrap",
        }}>
          <div style={{ padding:"0.45rem 1rem", borderRight:"1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ color:"rgb(255, 255, 255)", fontSize:"0.6rem", textTransform:"uppercase", letterSpacing:"0.08em" }}>Before</div>
            <div style={{ color:getRiskHex(prediction.risk_score), fontWeight:800, fontSize:"1rem", fontFamily:"monospace" }}>
              {prediction.risk_score?.toFixed(0)}
            </div>
          </div>
          <div style={{ padding:"0.45rem 0.5rem", display:"flex", alignItems:"center", color:"rgba(255,255,255,0.3)" }}>→</div>
          <div style={{ padding:"0.45rem 1rem" }}>
            <div style={{ color:"rgb(255, 255, 255)", fontSize:"0.6rem", textTransform:"uppercase", letterSpacing:"0.08em" }}>After Sim</div>
            <div style={{ color:getRiskHex(simResult.risk_score), fontWeight:800, fontSize:"1rem", fontFamily:"monospace" }}>
              {simResult.risk_score?.toFixed(0)}
            </div>
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      <div style={{
        position:"absolute", bottom:"14px", right:"14px", zIndex:1000,
        background:"rgba(10,15,30,0.94)",
        border:"1px solid rgba(255,255,255,0.1)",
        borderRadius:"10px", padding:"0.7rem 1rem",
        backdropFilter:"blur(8px)",
        boxShadow:"0 4px 24px rgba(0,0,0,0.5)",
        minWidth:"170px",
      }}>
        <div style={{ fontWeight:700, color:"#e2e8f0", marginBottom:"0.5rem", fontSize:"0.8rem" }}>
          Risk Level
        </div>
        {[
          ["#00ff88","Low (0 - 40)"],
          ["#fbbf24","Medium (41 - 70)"],
          ["#ef4444","High (71 - 100)"],
        ].map(([c, t]) => (
          <div key={t} style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.3rem" }}>
            <div style={{ width:13, height:13, borderRadius:"50%", flexShrink:0, background:c, boxShadow:`0 0 6px ${c}99` }} />
            <span style={{ color:"rgba(255,255,255,0.78)", fontSize:"0.78rem" }}>{t}</span>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {!displayData && (
        <div style={{
          position:"absolute", inset:0, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          background:"rgba(10,15,30,0.7)", zIndex:500, color:"var(--text-secondary)",
        }}>
          <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>🗺️</div>
          <div style={{ fontWeight:600, marginBottom:"0.3rem" }}>No data loaded</div>
          <div style={{ fontSize:"0.82rem" }}>Run a prediction first</div>
        </div>
      )}
    </div>
  );
}