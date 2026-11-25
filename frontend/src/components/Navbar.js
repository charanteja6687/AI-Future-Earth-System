import React from "react";
import { useApp } from "../context/AppContext"; // keep if used elsewhere
import "./Navbar.css";

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">🌍</span>
        <div>
          <div className="navbar-title">
            AI FUTURE EARTH SIMULATION SYSTEM
          </div>
          <div className="navbar-sub">
            Predict Future. Simulate Impact. Protect Earth.
          </div>
        </div>
      </div>
    </header>
  );
}