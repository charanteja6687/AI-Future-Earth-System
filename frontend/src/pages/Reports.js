// FILE: frontend/src/pages/Reports.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import LoadingOverlay from "../components/LoadingOverlay";
import { getRiskColor, getRiskBadgeClass } from "../utils/helpers";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "./Reports.css";

export default function Reports() {
  const navigate = useNavigate();
  const {
    simulationData,
    prediction, simResult, report,
    loading, runPrediction, runSimulation,
    resetApp,                             // ← full reset from context
  } = useApp();

  const [generating, setGenerating] = useState(false);
  const [generated,  setGenerated]  = useState(false);

  const p = prediction;
  const s = simResult;
  const r = report;

  const country       = simulationData?.country || "";
  const state         = simulationData?.state   || "";
  const year          = simulationData?.year    || "";
  const locationLabel = `${country}${state ? `, ${state}` : ""}`;

  // ── Generate report then auto-download PDF ────────────────────────────────────
  async function handleGenerate() {
    if (!simulationData) return;
    if (!p) await runPrediction();
    await runSimulation();
    setGenerated(true);
    setTimeout(() => downloadPDF(), 300);
  }

  // ── Reset everything and go back to Home ─────────────────────────────────────
  function handleReset() {
    resetApp();       // clears ALL context state to initial values
    navigate("/");    // navigate to home for fresh start
  }

  function downloadPDF() {
    if (!p) return;
    setGenerating(true);
    try {
      const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
      const W   = doc.internal.pageSize.getWidth();

      doc.setFillColor(10, 15, 30);
      doc.rect(0, 0, W, 297, "F");

      doc.setFillColor(0, 255, 136);
      doc.rect(0, 0, W, 20, "F");
      doc.setTextColor(10, 15, 30);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("AI FUTURE EARTH SIMULATION REPORT", W/2, 13, { align:"center" });

      doc.setFillColor(13, 21, 41);
      doc.rect(0, 20, W, 14, "F");
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`${locationLabel} — Year ${year}`, W/2, 28, { align:"center" });
      doc.text(`Generated: ${new Date().toLocaleString()}`, W/2, 34, { align:"center" });

      let y = 46;

      doc.setTextColor(0, 255, 136);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("EXECUTIVE SUMMARY", 15, y);
      y += 8;

      doc.setTextColor(226, 232, 240);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const summary =
        `This report presents AI-generated environmental predictions for ${locationLabel} for the year ${year}. ` +
        `The Environmental Risk Score is ${p.risk_score?.toFixed(1)||"N/A"}/100 (${p.risk_level||"N/A"} Risk). ` +
        `Key factors: temperature ${p.temperature?.toFixed(1)||"N/A"}°C, AQI ${p.aqi?.toFixed(0)||"N/A"}, ` +
        `water ${p.water?.toFixed(1)||"N/A"}%, forest cover ${p.forest?.toFixed(1)||"N/A"}%.`;
      const summaryLines = doc.splitTextToSize(summary, W - 30);
      doc.text(summaryLines, 15, y);
      y += summaryLines.length * 5 + 8;

      doc.setTextColor(0, 212, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("PREDICTION OVERVIEW", 15, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [["Metric","Predicted Value","Status","Weight"]],
        body: [
          ["Temperature",       `${p.temperature?.toFixed(2)||"—"} °C`, "High",                      "25%"],
          ["AQI",               `${p.aqi?.toFixed(1)||"—"}`,            p.aqi>150?"High":"Moderate",  "30%"],
          ["Water Availability",`${p.water?.toFixed(2)||"—"} %`,        p.water<40?"High":"Moderate", "20%"],
          ["Forest Cover",      `${p.forest?.toFixed(2)||"—"} %`,       p.forest<15?"Critical":"Low", "25%"],
          ["RISK SCORE",        `${p.risk_score?.toFixed(2)||"—"} / 100`, p.risk_level||"—",          "100%"],
        ],
        theme:"grid",
        headStyles:        { fillColor:[0,100,60],  textColor:[255,255,255], fontStyle:"bold", fontSize:9 },
        bodyStyles:        { fillColor:[13,21,41],  textColor:[226,232,240], fontSize:8 },
        alternateRowStyles:{ fillColor:[17,28,55] },
        styles:            { cellPadding:2.5, lineColor:[30,58,95] },
      });
      y = doc.lastAutoTable.finalY + 10;

      if (s) {
        doc.setTextColor(0, 255, 136);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("SIMULATION ANALYSIS", 15, y);
        y += 6;

        autoTable(doc, {
          startY: y,
          head: [["Metric","Baseline","After Simulation","Change"]],
          body: [
            ["Temperature",`${p.temperature?.toFixed(2)} °C`,  `${s.temperature?.toFixed(2)} °C`,  `${(s.temperature-p.temperature).toFixed(2)} °C`],
            ["AQI",        `${p.aqi?.toFixed(1)}`,             `${s.aqi?.toFixed(1)}`,              `${(s.aqi-p.aqi).toFixed(1)}`],
            ["Water (%)",  `${p.water?.toFixed(2)} %`,         `${s.water?.toFixed(2)} %`,          `${(s.water-p.water)>=0?"+":""}${(s.water-p.water).toFixed(2)} %`],
            ["Forest (%)", `${p.forest?.toFixed(2)} %`,        `${s.forest?.toFixed(2)} %`,         `${(s.forest-p.forest)>=0?"+":""}${(s.forest-p.forest).toFixed(2)} %`],
            ["Risk Score", `${p.risk_score?.toFixed(2)} / 100`,`${s.risk_score?.toFixed(2)} / 100`, `${(s.risk_score-p.risk_score).toFixed(2)}`],
          ],
          theme:"grid",
          headStyles:        { fillColor:[0,80,50],   textColor:[255,255,255], fontStyle:"bold", fontSize:9 },
          bodyStyles:        { fillColor:[13,21,41],  textColor:[226,232,240], fontSize:8 },
          alternateRowStyles:{ fillColor:[17,28,55] },
          styles:            { cellPadding:2.5, lineColor:[30,58,95] },
        });
        y = doc.lastAutoTable.finalY + 10;
      }

      if (y < 220 && r?.scenarios?.length) {
        doc.setTextColor(0, 212, 255);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("SCENARIO COMPARISON", 15, y);
        y += 6;
        autoTable(doc, {
          startY: y,
          head: [["Scenario","Temp (°C)","AQI","Water (%)","Forest (%)","Risk Score"]],
          body: r.scenarios.map(sc => [
            sc.label||"—",
            sc.temperature?.toFixed(1)||"—",
            sc.aqi?.toFixed(0)||"—",
            sc.water?.toFixed(0)||"—",
            sc.forest?.toFixed(0)||"—",
            `${sc.risk_score?.toFixed(0)||"—"} (${sc.risk_level||"—"})`,
          ]),
          theme:"grid",
          headStyles:        { fillColor:[30,30,80],  textColor:[255,255,255], fontStyle:"bold", fontSize:8 },
          bodyStyles:        { fillColor:[13,21,41],  textColor:[226,232,240], fontSize:8 },
          alternateRowStyles:{ fillColor:[17,28,55] },
          styles:            { cellPadding:2, lineColor:[30,58,95] },
        });
        y = doc.lastAutoTable.finalY + 10;
      }

      if (r?.ai_insights?.length) {
        // Add new page if not enough space
if (y > 240) {
  doc.addPage();

  // Background again (important for your theme)
  doc.setFillColor(10, 15, 30);
  doc.rect(0, 0, W, 297, "F");

  y = 20;
}
        doc.setTextColor(0, 255, 136);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("AI INSIGHTS & RECOMMENDATIONS", 15, y);
        y += 7;
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        r.ai_insights.forEach((raw, i) => {
          const text = typeof raw === "string"
            ? raw.replace(/^[^\w]+/, "")
            : `${raw.title ? raw.title + ": " : ""}${raw.message || ""}`;
          const lines = doc.splitTextToSize(`${i+1}. ${text}`, W - 30);
          if (y + lines.length * 5 > 280) return;
          doc.text(lines, 15, y);
          y += lines.length * 5 + 2;
        });
      }

      doc.setFillColor(0, 255, 136);
      doc.rect(0, 285, W, 12, "F");
      doc.setTextColor(10, 15, 30);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("AI Future Earth Simulation System  |  Predict. Prepare. Protect.", W/2, 292, { align:"center" });

      doc.save(`AI_Future_Earth_${country}_${state||"All"}_${year}.pdf`);
    } catch(err) {
      console.error("PDF error:", err);
    } finally {
      setGenerating(false);
    }
  }

  const includes = [
    "Executive Summary",
    "Prediction Overview",
    "Simulation Analysis",
    "AI Insights",
    "Scenario Comparison",
    "Recommendations",
  ];

  // ── No simulation data yet ────────────────────────────────────────────────────
  if (!simulationData) {
    return (
      <div className="reports">
        <div className="page-title">📋 Report &amp; Download</div>
        <div className="page-subtitle">Generate and download detailed reports</div>
        <div className="section-card" style={{ textAlign:"center", padding:"3rem" }}>
          <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>📊</div>
          <div style={{ fontSize:"1rem", fontWeight:700, color:"var(--text-primary)", marginBottom:"0.5rem" }}>
            No simulation data available
          </div>
          <div style={{ fontSize:"0.85rem", color:"var(--text-secondary)", marginBottom:"1.5rem" }}>
            Please go to the <b>Simulation</b> page, select a location and year,
            then run a prediction first.
          </div>
          {/* Start New Simulation also works from empty state */}
          <button className="btn-primary" onClick={handleReset}>
            🔄 Start New Simulation
          </button>
        </div>
      </div>
    );
  }

  // ── Main Reports UI ───────────────────────────────────────────────────────────
  return (
    <div className="reports">
      {(loading || generating) && <LoadingOverlay message={generating ? "Generating PDF…" : "AI is thinking…"} />}

      <div className="page-title">📋 Report &amp; Download</div>
      <div className="page-subtitle">Generate and download detailed reports</div>

      <div className="section-card" style={{ marginBottom:"1rem" }}>
        <div className="section-card-header">
          <span className="section-card-title">F. REPORT &amp; DOWNLOAD</span>
        </div>

        <div className="report-layout">
          {/* Preview card */}
          <div className="report-preview-card">
            <div className="report-preview-img">
              <div style={{ fontSize:"3rem", marginBottom:"0.5rem" }}>🌍</div>
              <div style={{ fontFamily:"var(--font-display)", fontSize:"0.7rem", color:"var(--accent-green)", letterSpacing:"0.1em" }}>
                AI FUTURE EARTH
              </div>
              <div style={{ fontSize:"0.65rem", color:"#ffffffc7", marginTop:"0.25rem" }}>
                SIMULATION REPORT
              </div>
              <div style={{ fontSize:"0.6rem", color:"#ffffffc7", marginTop:"0.5rem" }}>
                {locationLabel} — {year}
              </div>
              {p && (
                <div style={{ marginTop:"0.75rem", padding:"0.4rem 0.75rem", background:"rgba(0,0,0,0.3)", borderRadius:"6px" }}>
                  <div style={{ fontSize:"0.6rem", color:"#ffffffc7" }}>Risk Score</div>
                  <div style={{ fontFamily:"var(--font-display)", fontSize:"1.1rem", fontWeight:900, color:getRiskColor(p.risk_score) }}>
                    {p.risk_score?.toFixed(0)}/100
                  </div>
                  <div style={{ fontSize:"0.65rem", color:getRiskColor(p.risk_score) }}>{p.risk_level} Risk</div>
                </div>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="report-details">
            {/* Read-only location display */}
            <div style={{
              background:"var(--bg-glass)", border:"1px solid var(--border)",
              borderRadius:"var(--radius-sm)", padding:"0.75rem 1rem", marginBottom:"1rem",
            }}>
              <div style={{ fontSize:"0.65rem", color:"#ffffffc7", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.5rem" }}>
                Simulation Parameters
              </div>
              <div style={{ display:"flex", gap:"1.5rem", flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontSize:"0.65rem", color:"#ffffffc7" }}>Country</div>
                  <div style={{ fontSize:"0.88rem", fontWeight:700, color:"#ffffffc7"}}>{country}</div>
                </div>
                {state && (
                  <div>
                    <div style={{ fontSize:"0.65rem", color:"#ffffffc7" }}>State</div>
                    <div style={{ fontSize:"0.88rem", fontWeight:700, color:"#ffffffc7" }}>{state}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize:"0.65rem", color:"#ffffffc7" }}>Year</div>
                  <div style={{ fontSize:"0.88rem", fontWeight:700, color:"#ffffffc7" }}>{year}</div>
                </div>
              </div>
            </div>

            {/* Report includes list */}
            <div style={{ marginBottom:"1rem" }}>
              <div className="section-card-title" style={{ marginBottom:"0.75rem" }}>Report Includes:</div>
              {includes.map(item => (
                <div key={item} className="report-include-row">
                  <span style={{ color:"var(--accent-green)", fontSize:"0.9rem" }}>✓</span>
                  <span style={{ fontSize:"0.82rem", color:"#ffffffc7" }}>{item}</span>
                </div>
              ))}
            </div>

            {/* ── Buttons row ── */}
            <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap", alignItems:"center" }}>
              {/* Generate & Download */}
              <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
                ⬇ Generate &amp; Download PDF
              </button>

              {/* Re-download (shown after first generation) */}
              {generated && p && (
                <button
  onClick={downloadPDF}
  style={{
    background: "#00ff99c7",
    color: "#000",
    border: "none",
    padding: "10px 18px",
    borderRadius: "6px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 0 10px rgba(0,255,153,0.5)"
  }}
>
  🔁 Re-download PDF
</button>
              )}

              {/* ── Start New Simulation — resets ALL state and goes to Home ── */}
           <button
  onClick={handleReset}
  style={{
    background: "#00ff99c7",
    color: "#000",
    border: "none",
    padding: "10px 18px",
    borderRadius: "6px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 0 10px rgba(0,255,153,0.5)"
  }}
>
  🔄 Start New Simulation
</button>
            </div>

            <div style={{ marginTop:"0.75rem", fontSize:"0.72rem", color:"#ffffffb0" }}>
              "Start New Simulation" clears all data and returns to Home.
            </div>
          </div>
        </div>
      </div>

      {/* Report preview */}
      {generated && p && (
        <div className="section-card">
          <div className="section-card-header">
            <span className="section-card-title">📄 Report Preview</span>
          </div>

          <div className="report-section-title">📊 Prediction Summary</div>
          <div className="grid-4" style={{ gap:"0.75rem", marginBottom:"1rem" }}>
            {[
              { icon:"🌡️", label:"Temperature",      value:`${p.temperature?.toFixed(2)} °C`, color:"var(--risk-high)"    },
              { icon:"🌫️", label:"AQI",              value:`${p.aqi?.toFixed(1)}`,            color:"var(--accent-orange)"},
              { icon:"💧", label:"Water Availability", value:`${p.water?.toFixed(2)} %`,       color:"var(--accent-blue)"  },
              { icon:"🌳", label:"Forest Cover",      value:`${p.forest?.toFixed(2)} %`,       color:"var(--risk-low)"     },
            ].map(item => (
              <div key={item.label} className="metric-card">
                <div style={{ fontSize:"1.2rem" }}>{item.icon}</div>
                <div className="metric-value" style={{ color:item.color }}>{item.value}</div>
                <div className="metric-label">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="report-risk-row">
            <div className="report-risk-big" style={{ color:getRiskColor(p.risk_score) }}>
              ⚠️ Environmental Risk Score:{" "}
              <span style={{ fontFamily:"var(--font-display)", fontSize:"1.4rem", fontWeight:900 }}>
                {p.risk_score?.toFixed(2)}
              </span>{" "}/ 100
            </div>
            <span className={getRiskBadgeClass(p.risk_level)} style={{ fontSize:"0.85rem", padding:"0.4rem 1rem" }}>
              {p.risk_level} Risk
            </span>
          </div>

          {s && (
            <>
              <div className="report-section-title" style={{ marginTop:"1rem" }}>🎮 Simulation Impact</div>
              <div className="grid-4" style={{ gap:"0.75rem" }}>
                {[
                  { label:"Temperature", before:`${p.temperature?.toFixed(1)}°C`, after:`${s.temperature?.toFixed(1)}°C`, better:s.temperature<p.temperature },
                  { label:"AQI",         before:`${p.aqi?.toFixed(0)}`,            after:`${s.aqi?.toFixed(0)}`,          better:s.aqi<p.aqi },
                  { label:"Water %",     before:`${p.water?.toFixed(1)}%`,         after:`${s.water?.toFixed(1)}%`,        better:s.water>p.water },
                  { label:"Risk Score",  before:`${p.risk_score?.toFixed(1)}`,     after:`${s.risk_score?.toFixed(1)}`,    better:s.risk_score<p.risk_score },
                ].map(item => (
                  <div key={item.label} className="metric-card">
                    <div className="metric-label" style={{ marginBottom:"0.4rem" }}>{item.label}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.4rem", justifyContent:"center" }}>
                      <span style={{ fontSize:"0.85rem", color:"var(--risk-high)", textDecoration:"line-through" }}>{item.before}</span>
                      <span style={{ color:"var(--text-muted)" }}>→</span>
                      <span style={{ fontSize:"0.9rem", fontWeight:700, color:item.better?"var(--risk-low)":"var(--risk-medium)" }}>{item.after}</span>
                    </div>
                    <div style={{ fontSize:"0.65rem", color:item.better?"var(--risk-low)":"var(--risk-medium)", marginTop:"0.2rem" }}>
                      {item.better ? "✓ Improved" : "⚠ Worsened"}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {(r?.ai_insights||[]).length > 0 && (
            <>
              <div className="report-section-title" style={{ marginTop:"1rem" }}>💡 AI Insights</div>
              {r.ai_insights.map((raw, i) => {
                const ins = typeof raw === "string"
                  ? { icon:raw.slice(0,2), title:"AI Insight", message:raw.slice(2).trim() }
                  : raw;
                return (
                  <div key={i} className="insight-item">
                    <span style={{ fontSize:"1rem" }}>{ins.icon}</span>
                    <span style={{ fontSize:"0.82rem", color:"var(--text-secondary)" }}>
                      {ins.title && <b style={{ color:"var(--text-primary)" }}>{ins.title}: </b>}
                      {ins.message}
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}