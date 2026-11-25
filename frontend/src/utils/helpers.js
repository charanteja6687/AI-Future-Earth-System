// FILE: frontend/src/utils/helpers.js
// SLIDER CONVENTION:
//   RIGHT (+100) = BEST  = GREEN  (sustainable)
//   CENTRE (0)   = NEUTRAL
//   LEFT  (-100) = WORST = RED    (dangerous)

export function clamp(val, min, max) { return Math.min(Math.max(val, min), max); }

// Risk score → CSS colour  (0-40 green, 41-70 yellow, 71-100 red)
export function getRiskColor(score) {
  if (score == null) return "var(--text-muted)";
  if (score <= 40)   return "var(--risk-low)";
  if (score <= 70)   return "var(--risk-medium)";
  return                    "var(--risk-high)";
}

// Same thresholds as getRiskColor/getRiskLevel — ONE source of truth.
// (Previously this had a 4th "orange" tier at 85 that didn't match
// getRiskColor's 3-tier scale — that mismatch is now fixed.)
export function getRiskHex(score) {
  if (score == null) return "#94a3b8";
  if (score <= 40)   return "#00ff88";   // Low
  if (score <= 70)   return "#fbbf24";   // Medium
  return                    "#ef4444";   // High
}

export function getRiskBadgeClass(level) {
  const l = (level||"").toLowerCase();
  if (l==="low")    return "badge badge-low";
  if (l==="medium") return "badge badge-medium";
  return "badge badge-high";
}

export function getRiskEmoji(level) {
  const l=(level||"").toLowerCase();
  if (l==="low")    return "🟢";
  if (l==="medium") return "🟡";
  return "🔴";
}

export function getRiskLevel(score) {
  if (score <= 40) return "Low";
  if (score <= 70) return "Medium";
  return "High";
}

// Frontend risk recalc (mirrors Python)
export function calcRiskScore(temp, aqi, water, forest) {
  const tN = clamp(temp/50, 0, 1)*100;
  const aN = clamp(aqi/500, 0, 1)*100;
  const wI = 100 - clamp(water, 0, 100);
  const fI = 100 - clamp(forest, 0, 100);
  return clamp(+(tN*.25 + aN*.30 + wI*.20 + fI*.25).toFixed(2), 0, 100);
}

// Slider value → colour
// +value (right) = green (good)
// -value (left)  = red   (bad)
export function sliderValueColor(value) {
  if (value > 0)  return "#00ff88"; // green = good
  if (value < 0)  return "#ef4444"; // red   = bad
  return "var(--text-secondary)";   // neutral
}

// Live impact label below each slider.
//
// IMPORTANT: these sliders represent "how good/bad this factor's outcome is"
// on a -100 (worst) to +100 (best) scale — NOT a literal percentage change.
// Moving a slider LEFT (negative) = simulating a WORSE scenario for that factor.
// Moving a slider RIGHT (positive) = simulating a BETTER scenario for that factor.
//
// Example: populationGrowth = -91 means "simulate severe overpopulation
// strain" (bad outcome), NOT "population literally shrank by 91%".
export function sliderImpactLabel(key, value) {
  if (value === 0) return "Neutral — no change from AI prediction";
  const abs = Math.abs(value);
  const intensity = abs>=75?"Severe":abs>=50?"Significant":abs>=25?"Moderate":"Mild";
  const LABELS = {
    populationGrowth: value>0
      ? `✅ ${intensity} population control — eases AQI & water stress`
      : `⚠️ ${intensity} overpopulation strain — worsens AQI & water stress`,
    industrialGrowth: value>0
      ? `✅ ${intensity} clean/sustainable industry — lowers temperature & AQI`
      : `⚠️ ${intensity} heavy/unchecked industry — raises temperature & AQI`,
    pollutionControl: value>0
      ? `✅ ${intensity} pollution reduction — AQI improves`
      : `⚠️ ${intensity} pollution increase — AQI worsens`,
    waterUsage: value>0
      ? `✅ ${intensity} efficient water use — availability increases`
      : `⚠️ ${intensity} water waste/mismanagement — availability drops`,
    greenCover: value>0
      ? `✅ ${intensity} reforestation — forest & water improve`
      : `⚠️ ${intensity} deforestation — forest & water decline`,
  };
  return LABELS[key] || `${value>0?"✅ Good":"⚠️ Bad"} outcome: ${key} at ${value}`;
}

export function tempStatus(t) {
  if (t >= 45) return { label:"Extreme Heat", cls:"badge-high",   color:"#ef4444" };
  if (t >= 35) return { label:"Hot",          cls:"badge-high",   color:"#f97316" };
  if (t >= 25) return { label:"Warm",         cls:"badge-medium", color:"#fbbf24" };
  if (t >= 15) return { label:"Moderate",     cls:"badge-low",    color:"#00ff88" };
  return              { label:"Cool",         cls:"badge-low",    color:"#00d4ff" };
}
export function aqiStatus(aqi) {
  if (aqi >= 300) return { label:"Hazardous",      cls:"badge-high",   color:"#ef4444" };
  if (aqi >= 200) return { label:"Very Unhealthy", cls:"badge-high",   color:"#f97316" };
  if (aqi >= 150) return { label:"Unhealthy",      cls:"badge-high",   color:"#f97316" };
  if (aqi >= 100) return { label:"Sensitive",      cls:"badge-medium", color:"#fbbf24" };
  if (aqi >= 50)  return { label:"Moderate",       cls:"badge-medium", color:"#fbbf24" };
  return                 { label:"Good",           cls:"badge-low",    color:"#00ff88" };
}
export function waterStatus(w) {
  if (w <= 15) return { label:"Critical", cls:"badge-high",   color:"#ef4444" };
  if (w <= 30) return { label:"Scarce",   cls:"badge-high",   color:"#f97316" };
  if (w <= 50) return { label:"Low",      cls:"badge-medium", color:"#fbbf24" };
  if (w <= 70) return { label:"Moderate", cls:"badge-low",    color:"#00ff88" };
  return              { label:"Adequate", cls:"badge-low",    color:"#00ff88" };
}
export function forestStatus(f) {
  if (f <= 10) return { label:"Critical",   cls:"badge-high",   color:"#ef4444" };
  if (f <= 20) return { label:"Depleted",   cls:"badge-high",   color:"#f97316" };
  if (f <= 33) return { label:"Below Rec.", cls:"badge-medium", color:"#fbbf24" };
  if (f <= 50) return { label:"Moderate",   cls:"badge-low",    color:"#00ff88" };
  return              { label:"Healthy",    cls:"badge-low",    color:"#00ff88" };
}

export const COUNTRY_COORDS = {
  India:[20.5937,78.9629], USA:[37.0902,-95.7129], China:[35.8617,104.1954],
  Russia:[61.524,105.3188], Brazil:[-14.235,-51.9253], Germany:[51.1657,10.4515],
  UK:[55.3781,-3.436], Japan:[36.2048,138.2529], Australia:[-25.2744,133.7751], Canada:[56.1304,-106.3468],
};
export const STATE_COORDS = {
  "Andhra Pradesh":[15.9129,79.74],"Arunachal Pradesh":[28.218,94.7278],"Assam":[26.2006,92.9376],
  "Bihar":[25.0961,85.3131],"Chhattisgarh":[21.2787,81.8661],"Goa":[15.2993,74.124],
  "Gujarat":[22.2587,71.1924],"Haryana":[29.0588,76.0856],"Himachal Pradesh":[31.1048,77.1734],
  "Jharkhand":[23.6102,85.2799],"Karnataka":[15.3173,75.7139],"Kerala":[10.8505,76.2711],
  "Madhya Pradesh":[22.9734,78.6569],"Maharashtra":[19.7515,75.7139],"Manipur":[24.6637,93.9063],
  "Meghalaya":[25.467,91.3662],"Mizoram":[23.1645,92.9376],"Nagaland":[26.1584,94.5624],
  "Odisha":[20.9517,85.0985],"Punjab":[31.1471,75.3412],"Rajasthan":[27.0238,74.2179],
  "Sikkim":[27.533,88.5122],"Tamil Nadu":[11.1271,78.6569],"Telangana":[18.1124,79.0193],
  "Tripura":[23.9408,91.9882],"Uttar Pradesh":[26.8467,80.9462],"Uttarakhand":[30.0668,79.0193],
  "West Bengal":[22.9868,87.855],
};