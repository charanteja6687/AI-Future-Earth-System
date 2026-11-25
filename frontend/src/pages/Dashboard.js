import React from "react";
import { useNavigate } from "react-router-dom";
import { useApp, COUNTRIES, INDIA_STATES } from "../context/AppContext";
import MetricCard     from "../components/MetricCard";
import RiskGauge      from "../components/RiskGauge";
import LoadingOverlay from "../components/LoadingOverlay";
import { getRiskColor } from "../utils/helpers";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    country, setCountry, state, setState, year, setYear,
    prediction, trendData, loading, error, runPrediction,
  } = useApp();
  
  const [simError, setSimError] = React.useState("");
  const p = prediction;
  const t = trendData;

  return (
    <div className="dashboard">
      {loading && <LoadingOverlay />}

      <div className="page-title">📊 Dashboard</div>
  

      <div className="dashboard-top">
        {/* A: Prediction Panel */}
        <div className="section-card dash-predict">
          <div className="section-card-header">
            <span style={{ color:"var(--accent-blue)", fontSize:"0.9rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em" }}>
              PREDICTION (AI MODEL)
            </span>
            <span className="section-card-sub">AI predicts the future based on historical data</span>
          </div>

          <div className="predict-inputs">
            <div className="input-group">
              <label className="input-label">Select Location</label>
              <select value={country} onChange={e => { setCountry(e.target.value); setState(""); }} style={{ width:"100%" }}>
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
              {country === "India" && (
                <select value={state} onChange={e => setState(e.target.value)} style={{ width:"100%", marginTop:"0.5rem" }}>
                  <option value="">All States</option>
                  {INDIA_STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              )}
            </div>
            <div className="input-group">
              <label className="input-label">Select Year</label>
              <select value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ width:"100%" }}>
                {Array.from({ length:76 }, (_, i) => 2025 + i).map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <button 
  className="btn-primary" 
  onClick={() => {
    setSimError("");   // clears message immediately
    runPrediction();
  }}
  style={{ alignSelf:"flex-end", whiteSpace:"nowrap" }}
>
  ▶ Run AI Prediction
</button>
          </div>

          {error && <div style={{ color:"var(--risk-high)", fontSize:"0.8rem", marginTop:"0.5rem" }}>⚠️ {error}</div>}

          {p && (
            <>
              <div className="predict-results-label">AI Predicted Outcomes for {year}</div>
              <div className="grid-5" style={{ gap:"0.75rem" }}>
                <MetricCard icon="🌡️" label="Temperature Rise"    value={`+${p.temperature?.toFixed(1)}`} unit="°C" sub="Compared to 2024"                                                          subColor="var(--risk-high)"    tooltip="Avg temperature rise from baseline" />
                <MetricCard icon="🌫️" label="AQI Level"           value={p.aqi?.toFixed(0)}                         sub={p.aqi>200?"Very Unhealthy":p.aqi>150?"Unhealthy":p.aqi>100?"Sensitive":"Moderate"} subColor="var(--accent-orange)" tooltip="Air Quality Index" />
                <MetricCard icon="💧" label="Water Availability"  value={p.water?.toFixed(0)}             unit="%" sub={p.water<40?"Low":p.water<60?"Moderate":"Good"}                                subColor="var(--accent-blue)"  tooltip="Fresh water availability %" />
                <MetricCard icon="🌳" label="Forest Cover"        value={p.forest?.toFixed(0)}            unit="%" sub="Decreased"                                                                   subColor="var(--risk-low)"     tooltip="Forest cover %" />
                <div className="metric-card" style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                  <div style={{ fontSize:"0.65rem", color:"#ffffffa2", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.4rem" }}>Overall Risk Score</div>
                  <div style={{ fontFamily:"var(--font-display)", fontSize:"1.8rem", fontWeight:900, color:getRiskColor(p.risk_score) }}>
                    {p.risk_score?.toFixed(0)}<span style={{ fontSize:"0.9rem", color:"#ffffffa2" }}>/100</span>
                  </div>
                  <div style={{ fontSize:"0.75rem", color:getRiskColor(p.risk_score), fontWeight:700, marginTop:"0.2rem" }}>
                    {p.risk_level} Risk
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* B: Quick navigation panel */}
        <div className="section-card dash-sim-hint">
          <div className="section-card-header">
            <span style={{ color:"var(--accent-green)", fontSize:"0.9rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em" }}>
              QUICK NAVIGATION
            </span>
          </div>

          {p && (
            <div className="sim-hint-gauge">
              <RiskGauge score={p.risk_score} level={p.risk_level} size="lg" />
            </div>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", marginTop:"1rem" }}>
     <button 
  className="btn-glow"
  onClick={() => {
    if (!prediction) {
      setSimError("⚠️ Run AI Prediction first!");

      // ⏳ auto remove message after 3 seconds
      setTimeout(() => {
        setSimError("");
      }, 3000);

      return;
    }

    setSimError("");
    navigate("/simulation");
  }}
>
  🎮 Run Simulation
</button>

{simError && (
  <div
    style={{
      color: "var(--risk-high)",
      fontSize: "0.8rem",
      marginTop: "0.5rem"
    }}
  >
    {simError}
  </div>
)}
               
          </div>
        </div>
      </div>

    </div>
  );
}
