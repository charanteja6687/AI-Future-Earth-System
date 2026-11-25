// FILE: backend/services/aiService.js
// Tries python / python3 / py in order, then falls back to JS model
const { spawn } = require("child_process");
const path      = require("path");
const fs        = require("fs");
const csv       = require("csv-parser");

const AI_DIR  = path.resolve(__dirname, "../../ai");
const DATA_DIR = path.resolve(__dirname, "../dataset");

// ── Auto-detect Python executable ────────────────────────────────────────────
const PYTHON_CANDIDATES = process.env.PYTHON_PATH
  ? [process.env.PYTHON_PATH]
  : ["python", "python3", "py"];

let _pythonExe = null; // cached after first successful detection

async function detectPython() {
  if (_pythonExe) return _pythonExe;
  for (const exe of PYTHON_CANDIDATES) {
    const found = await new Promise(resolve => {
      const p = spawn(exe, ["--version"]);
      p.on("close",  c => resolve(c === 0));
      p.on("error",  () => resolve(false));
    });
    if (found) { _pythonExe = exe; return exe; }
  }
  return null; // no Python found → use JS fallback
}

// ── Python bridge ─────────────────────────────────────────────────────────────
function runPython(exe, args) {
  return new Promise((resolve, reject) => {
    const proc   = spawn(exe, [path.join(AI_DIR, "predict.py"), ...args]);
    let   stdout = "";
    let   stderr = "";

    proc.stdout.on("data", d => (stdout += d.toString()));
    proc.stderr.on("data", d => (stderr += d.toString()));

    proc.on("close", code => {
      if (code !== 0) return reject(new Error(`Python exited ${code}: ${stderr.slice(0,300)}`));
      try {
        // strip any warnings that leaked to stdout before the JSON
        const jsonStart = stdout.lastIndexOf("{");
        if (jsonStart === -1) throw new Error("No JSON in output");
        resolve(JSON.parse(stdout.slice(jsonStart)));
      } catch {
        reject(new Error(`Invalid JSON from Python: ${stdout.slice(0, 200)}`));
      }
    });

    proc.on("error", err => reject(new Error(`Spawn error: ${err.message}`)));
  });
}

// ── JS Fallback model (Linear Regression in pure JS) ─────────────────────────
const BASE_PARAMS = {
  India:     { bt:28, ba:140, bw:55, bf:24, tr:0.045, ar:1.2,  wr:-0.25, fr:-0.12 },
  USA:       { bt:12, ba:55,  bw:70, bf:34, tr:0.035, ar:0.4,  wr:-0.18, fr:-0.08 },
  China:     { bt:14, ba:160, bw:45, bf:22, tr:0.050, ar:1.5,  wr:-0.30, fr:-0.15 },
  Russia:    { bt:2,  ba:50,  bw:80, bf:49, tr:0.060, ar:0.3,  wr:-0.10, fr:-0.06 },
  Brazil:    { bt:27, ba:60,  bw:75, bf:58, tr:0.040, ar:0.6,  wr:-0.22, fr:-0.25 },
  Germany:   { bt:9,  ba:35,  bw:78, bf:32, tr:0.030, ar:-0.1, wr:-0.12, fr: 0.02 },
  UK:        { bt:10, ba:40,  bw:75, bf:13, tr:0.032, ar:-0.1, wr:-0.10, fr: 0.03 },
  Japan:     { bt:15, ba:45,  bw:72, bf:68, tr:0.033, ar:0.2,  wr:-0.15, fr:-0.04 },
  Australia: { bt:22, ba:30,  bw:52, bf:19, tr:0.042, ar:0.3,  wr:-0.28, fr:-0.10 },
  Canada:    { bt:1,  ba:28,  bw:85, bf:38, tr:0.055, ar:0.1,  wr:-0.08, fr:-0.05 },
};

const STATE_PARAMS = {
  "Andhra Pradesh":    { bt:29, ba:120, bw:52, bf:23 },
  "Arunachal Pradesh": { bt:18, ba:35,  bw:85, bf:79 },
  "Assam":             { bt:24, ba:75,  bw:78, bf:36 },
  "Bihar":             { bt:27, ba:180, bw:48, bf:7  },
  "Chhattisgarh":      { bt:28, ba:95,  bw:58, bf:44 },
  "Goa":               { bt:27, ba:55,  bw:70, bf:34 },
  "Gujarat":           { bt:30, ba:135, bw:42, bf:7  },
  "Haryana":           { bt:24, ba:195, bw:43, bf:3  },
  "Himachal Pradesh":  { bt:14, ba:42,  bw:72, bf:27 },
  "Jharkhand":         { bt:26, ba:130, bw:50, bf:29 },
  "Karnataka":         { bt:27, ba:100, bw:55, bf:19 },
  "Kerala":            { bt:28, ba:65,  bw:72, bf:29 },
  "Madhya Pradesh":    { bt:28, ba:115, bw:50, bf:25 },
  "Maharashtra":       { bt:28, ba:145, bw:50, bf:16 },
  "Manipur":           { bt:22, ba:52,  bw:78, bf:75 },
  "Meghalaya":         { bt:20, ba:40,  bw:88, bf:76 },
  "Mizoram":           { bt:21, ba:35,  bw:82, bf:85 },
  "Nagaland":          { bt:20, ba:38,  bw:80, bf:78 },
  "Odisha":            { bt:28, ba:105, bw:58, bf:33 },
  "Punjab":            { bt:23, ba:185, bw:40, bf:6  },
  "Rajasthan":         { bt:32, ba:125, bw:32, bf:5  },
  "Sikkim":            { bt:15, ba:30,  bw:90, bf:82 },
  "Tamil Nadu":        { bt:30, ba:115, bw:48, bf:17 },
  "Telangana":         { bt:29, ba:135, bw:45, bf:20 },
  "Tripura":           { bt:25, ba:58,  bw:80, bf:59 },
  "Uttar Pradesh":     { bt:26, ba:210, bw:45, bf:6  },
  "Uttarakhand":       { bt:17, ba:55,  bw:68, bf:45 },
  "West Bengal":       { bt:27, ba:155, bw:55, bf:14 },
};

function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

function calcRisk(temp, aqi, water, forest) {
  const tN = clamp(temp / 50, 0, 1) * 100;
  const aN = clamp(aqi / 500, 0, 1) * 100;
  const wI = 100 - clamp(water,  0, 100);
  const fI = 100 - clamp(forest, 0, 100);
  return +clamp(tN*0.25 + aN*0.30 + wI*0.20 + fI*0.25, 0, 100).toFixed(2);
}
function riskLevel(s) { return s <= 40 ? "Low" : s <= 70 ? "Medium" : "High"; }

function jsFallbackPredict(country, state, year) {
  const offset = year - 2000;

  let temp, aqi, water, forest;

  if (country === "India" && state && STATE_PARAMS[state]) {
    const p  = STATE_PARAMS[state];
    const ip = BASE_PARAMS["India"];
    temp   = p.bt + ip.tr * offset;
    aqi    = p.ba + ip.ar * offset;
    water  = p.bw + ip.wr * offset;
    forest = p.bf + ip.fr * offset;
  } else {
    const p = BASE_PARAMS[country] || BASE_PARAMS["India"];
    temp   = p.bt + p.tr * offset;
    aqi    = p.ba + p.ar * offset;
    water  = p.bw + p.wr * offset;
    forest = p.bf + p.fr * offset;
  }

  aqi    = Math.max(aqi, 5);
  water  = clamp(water,  5, 100);
  forest = clamp(forest, 2, 95);

  const rs = calcRisk(temp, aqi, water, forest);
  return {
    temperature: +temp.toFixed(2),
    aqi:         +aqi.toFixed(1),
    water:       +water.toFixed(2),
    forest:      +forest.toFixed(2),
    risk_score:  rs,
    risk_level:  riskLevel(rs),
    source:      "js-fallback"
  };
}

function jsFallbackTrend(country, state, endYear) {
  const historical = [];
  for (let y = 2010; y <= 2024; y++) {
    const d = jsFallbackPredict(country, state, y);
    historical.push({ ...d, year: y });
  }
  const predicted = [];
  for (let y = 2025; y <= endYear; y++) {
    const d = jsFallbackPredict(country, state, y);
    predicted.push({ ...d, year: y });
  }
  return { historical, predicted };
}

// ── Public API ────────────────────────────────────────────────────────────────
async function getPrediction(country, state, year) {
  const exe = await detectPython();
  if (exe) {
    try {
      return await runPython(exe, [country, state || "_", String(year), "predict"]);
    } catch (err) {
      console.warn("Python prediction failed, using JS fallback:", err.message);
    }
  }
  return jsFallbackPredict(country, state, year);
}

async function getTrend(country, state, endYear) {
  const exe = await detectPython();
  if (exe) {
    try {
      return await runPython(exe, [country, state || "_", String(endYear), "trend"]);
    } catch (err) {
      console.warn("Python trend failed, using JS fallback:", err.message);
    }
  }
  return jsFallbackTrend(country, state, endYear);
}

module.exports = { getPrediction, getTrend };
