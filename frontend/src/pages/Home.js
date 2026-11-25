// FILE: frontend/src/pages/Home.js
import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const FEATURES = [
  { icon:"🔮", title:"Smart Predictions",      desc:"ML-powered forecasts for temperature, AQI, water, and forest cover up to 2100." },
  { icon:"📊", title:"Data-Driven Insights",   desc:"Historical trends merged with AI predictions across 10 countries and 28 Indian states." },
  { icon:"🛡️", title:"Risk Assessment",        desc:"Composite Environmental Risk Score (0–100) with Low / Medium / High classification." },
  { icon:"💡", title:"Better Decisions",       desc:"Simulate intervention scenarios and compare outcomes before they happen." },
];

const STEPS = [
  { num:"01", title:"Select Location",  desc:"Choose a country or Indian state from our database." },
  { num:"02", title:"Set Target Year",  desc:"Pick any year from 2025 to 2100 for prediction." },
  { num:"03", title:"Run AI Model",     desc:"Our Linear Regression model generates forecasts." },
  { num:"04", title:"Explore Results",  desc:"Analyse metrics, maps, charts, and AI insights." },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <video
  className="hero-background-video"
  autoPlay
  loop
  muted
  playsInline
>
  <source src="/videos/earth.mp4" type="video/mp4" />
</video>
        <div className="hero-bg">
          <div className="hero-orb orb1"></div>
          <div className="hero-orb orb2"></div>
          <div className="hero-grid"></div>
        </div>

        <div className="hero-content">
          <div className="hero-badge">🌿 Powered by Machine Learning</div>

          <h1 className="hero-title">AI Future Earth SIMULATOR</h1>

          <p className="hero-tagline">
            <span className="gradient-text">Predict.</span>
            <span style={{ color: "var(--accent-blue)" }}> Prepare.</span>
            <span style={{ color: "#a78bfa" }}> Protect.</span>
          </p>

          <p className="hero-desc">
            AI-powered simulations for a sustainable tomorrow. Forecast environmental conditions,
            simulate human impact, and make data-driven decisions for our planet's future.
          </p>

          {/* ✅ FIXED BUTTONS */}
          <div className="hero-actions">
            <button
              className="btn-primary hero-cta"
              onClick={() => navigate("/dashboard")}
            >
              Start Simulation →
            </button>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-val">10</div>
              <div className="hero-stat-lab">Countries</div>
            </div>
            <div className="hero-stat-div"></div>

            <div className="hero-stat">
              <div className="hero-stat-val">28</div>
              <div className="hero-stat-lab">Indian States</div>
            </div>
            <div className="hero-stat-div"></div>

            <div className="hero-stat">
              <div className="hero-stat-val">2100</div>
              <div className="hero-stat-lab">Year Horizon</div>
            </div>
            <div className="hero-stat-div"></div>

            <div className="hero-stat">
              <div className="hero-stat-val">4</div>
              <div className="hero-stat-lab">AI Metrics</div>
            </div>
          </div>
        </div>

      </section>

      {/* Features */}
      <section className="home-section" id="features">
        <div className="home-section-label">What We Offer</div>
        <h2 className="home-section-title">Core Features</h2>
        <div className="features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="home-section" id="about">
        <div className="home-section-label">Process</div>
        <h2 className="home-section-title">How It Works</h2>
        <div className="steps-grid">
          {STEPS.map(s => (
            <div key={s.num} className="step-card">
              <div className="step-num">{s.num}</div>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Risk Section */}
      <section className="home-section risk-section">
        <div className="home-section-label">Risk Engine</div>
        <h2 className="home-section-title">Environmental Risk Score</h2>

        <div className="risk-formula">
          <div className="risk-formula-text">
            Risk = (Temperature × 0.25) + (AQI × 0.30) + ((100 − Water) × 0.20) + ((100 − Forest) × 0.25)
          </div>
        </div>

        <div className="risk-levels">
          <div className="risk-level-card low">🟢 0–40 <b>Low Risk</b></div>
          <div className="risk-level-card mid">🟡 41–70 <b>Medium Risk</b></div>
          <div className="risk-level-card hi">🔴 71–100 <b>High Risk</b></div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta" id="contact">
        <h2>Ready to Simulate Earth's Future?</h2>
        <p>Join the AI-powered environmental intelligence platform.</p>

        <button
          className="btn-primary"
          style={{ fontSize:"1rem", padding:"0.8rem 2.5rem" }}
          onClick={() => navigate("/dashboard")}
        >
          Launch Dashboard →
        </button>
      </section>

      <footer className="home-footer">
        <span>🌍 AI Future Earth © 2024</span>
        <span style={{ color:"var(--text-muted)" }}>
          Built with React + Node.js + Python ML
        </span>
      </footer>
    </div>
  );
}