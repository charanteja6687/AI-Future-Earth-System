// FILE: frontend/src/pages/Settings.js
import React from "react";
import { useApp } from "../context/AppContext";
import "./Settings.css";

const MODELS      = ["Linear Regression", "LSTM", "Random Forest"];
const INTERVALS   = ["Yearly", "Monthly", "Decadal"];
const CONF_LEVELS = ["90%", "95%", "99%"];
const TEMP_UNITS  = ["°C", "°F"];
const RISK_LEVELS = ["Low", "Medium", "High"];

function Toggle({ value, onChange, label }) {
  return (
    <label className="toggle-wrap">
      <span className="toggle-label">{label}</span>
      <div
        className={"toggle" + (value ? " on" : "")}
        onClick={() => onChange(!value)}
      >
        <div className="toggle-thumb" />
      </div>
    </label>
  );
}

function SettingSelect({ label, value, options, onChange }) {
  return (
    <div className="setting-row">
      <div className="setting-label">{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ minWidth:"130px" }}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function Settings() {
  const { settings, setSettings } = useApp();
  function upd(key, val) {
    setSettings(prev => ({ ...prev, [key]: val }));
  }

  return (
    <div className="settings-page">
      <div className="page-title">⚙️ System Settings</div>
      <div className="page-subtitle">Customize model and preferences</div>

      <div className="settings-grid">
        {/* Model */}
        <div className="section-card">
          <div className="section-card-header">
            <span className="section-card-title">🤖 Model Settings</span>
          </div>
          <SettingSelect label="Prediction Model"    value={settings.modelType}          options={MODELS}      onChange={v=>upd("modelType",v)} />
          <SettingSelect label="Prediction Interval" value={settings.predictionInterval} options={INTERVALS}   onChange={v=>upd("predictionInterval",v)} />
          <SettingSelect label="Confidence Level"    value={settings.confidenceLevel}    options={CONF_LEVELS} onChange={v=>upd("confidenceLevel",v)} />
            <SettingSelect 
  label="Risk Sensitivity" 
  value={settings.riskSensitivity} 
  options={RISK_LEVELS} 
  onChange={v => upd("riskSensitivity", v)} 
/>
        </div>

        {/* About */}
        <div className="section-card">
          <div className="section-card-header">
            <span className="section-card-title">ℹ️ About</span>
          </div>
          <div className="about-rows">
            {[
              ["Version",       "1.0.0"],
              ["AI Engine",     settings.modelType],
              ["Countries",     "10"],
              ["Indian States", "28"],
              ["Year Range",    "2000–2100"],
              ["Backend",       "Node.js + Express"],
              ["Frontend",      "React + Recharts"],
              ["ML Library",    "scikit-learn"],
            ].map(([k,v]) => (
              <div key={k} className="about-row">
                <span className="about-key">{k}</span>
                <span className="about-val">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current config */}
      <div className="section-card" style={{ marginTop:"1rem" }}>
        <div className="section-card-header">
          <span className="section-card-title">📋 Current Configuration</span>
        </div>
        <div className="config-display">
          <pre style={{ fontFamily:"monospace", fontSize:"0.8rem", color:"var(--accent-green)", whiteSpace:"pre-wrap", lineHeight:1.6 }}>
{JSON.stringify(settings, null, 2)}
          </pre>
        </div>
        <div style={{ marginTop:"1rem", display:"flex", gap:"0.75rem" }}>
          <button className="btn-primary" onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
            alert("Configuration copied!");
          }}>
            📋 Export Config
          </button>
          <button className="btn-primary" onClick={() =>setSettings({
  modelType: "Linear Regression",
  confidenceLevel: "95%",
  tempUnit: "°C",
  predictionInterval: "Yearly",
  riskSensitivity: "Medium"
})}>
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Risk formula */}
      <div className="section-card" style={{ marginTop:"1rem" }}>
        <div className="section-card-header">
          <span className="section-card-title">⚠️ Risk Score Formula</span>
        </div>
        <div className="formula-box">
          <div className="formula-title">Environmental Risk Score Calculation:</div>
          <div className="formula-text">
            risk_score = (temperature_norm × 0.25) + (aqi_norm × 0.30) + ((100 − water) × 0.20) + ((100 − forest) × 0.25)
          </div>
          <div className="formula-note">Values are normalized to 0–100 range before calculation.</div>
          <div style={{ display:"flex", gap:"1rem", marginTop:"0.75rem", flexWrap:"wrap" }}>
            {[["🟢","0 – 40","Low Risk"],["🟡","41 – 70","Medium Risk"],["🔴","71 – 100","High Risk"]].map(([e,r,l])=>(
              <div key={l} style={{ display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.82rem" }}>
                <span>{e}</span>
                <span style={{ color:"#ffffff" }}>{r} →</span>
                <span style={{ fontWeight:700 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
