// FILE: backend/controllers/reportController.js
const { getPrediction, getTrend } = require("../services/aiService");

// ── Physical limits ───────────────────────────────────────────────────────────
function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

function sanitise(temp, aqi, water, forest) {
  return {
    temp:   clamp(temp,   0,   50),
    aqi:    clamp(aqi,    0,  500),
    water:  clamp(water,  0,  100),
    forest: clamp(forest, 0,  100),
  };
}

function calcRisk(temp, aqi, water, forest) {
  const tN = clamp(temp   / 50,  0, 1) * 100;
  const aN = clamp(aqi    / 500, 0, 1) * 100;
  const wI = 100 - clamp(water,  0, 100);
  const fI = 100 - clamp(forest, 0, 100);
  return +clamp(tN*0.25 + aN*0.30 + wI*0.20 + fI*0.25, 0, 100).toFixed(2);
}

function rl(s) { return s <= 40 ? "Low" : s <= 70 ? "Medium" : "High"; }

// ── Blended simulation engine ─────────────────────────────────────────────────
function pctAdjust(base, effectivePct, extremeAtMaxPct) {
  const pct = clamp(effectivePct, -100, 100);
  const percentageScaled = base * (1 + pct / 100);
  const blendWeight = Math.abs(pct) / 100;
  if (extremeAtMaxPct === undefined) return percentageScaled;
  return percentageScaled * (1 - blendWeight) + extremeAtMaxPct * blendWeight;
}

function applySimulation(base, factors = {}) {
  const pg = clamp(+(factors.populationGrowth ?? 0), -100, 100);
  const ig = clamp(+(factors.industrialGrowth ?? 0), -100, 100);
  const pc = clamp(+(factors.pollutionControl ?? 0), -100, 100);
  const wu = clamp(+(factors.waterUsage       ?? 0), -100, 100);
  const gc = clamp(+(factors.greenCover       ?? 0), -100, 100);

  const igH = -ig, pgH = -pg, pcH = -pc, wuB = wu, gcB = gc;

  const tempIG = pctAdjust(base.temperature, igH*0.60, igH>0?50:0);
  const tempGC = pctAdjust(base.temperature, -gcB*0.20, (-gcB)>0?50:0);
  const tempPG = pctAdjust(base.temperature, pgH*0.20, pgH>0?50:0);
  const rawTemp = (tempIG + tempGC + tempPG) / 3;

  const aqiPC = pctAdjust(base.aqi, pcH*0.50, pcH>0?500:0);
  const aqiIG = pctAdjust(base.aqi, igH*0.30, igH>0?500:0);
  const aqiPG = pctAdjust(base.aqi, pgH*0.20, pgH>0?500:0);
  const rawAqi = (aqiPC + aqiIG + aqiPG) / 3;

  const waterWU = pctAdjust(base.water, wuB*0.60, wuB>0?100:0);
  const waterGC = pctAdjust(base.water, gcB*0.40, gcB>0?100:0);
  const rawWater = (waterWU + waterGC) / 2;

  const forestGC = pctAdjust(base.forest, gcB*0.70, gcB>0?100:0);
  const fSigned  = -igH * 0.30;
  const forestIG = pctAdjust(base.forest, fSigned, fSigned>0?100:0);
  const rawForest = (forestGC + forestIG) / 2;

  const { temp, aqi, water, forest } = sanitise(rawTemp, rawAqi, rawWater, rawForest);
  const rs = calcRisk(temp, aqi, water, forest);

  return {
    temperature: +temp.toFixed(2),
    aqi:         +aqi.toFixed(1),
    water:       +water.toFixed(2),
    forest:      +forest.toFixed(2),
    risk_score:  rs,
    risk_level:  rl(rs),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// STRICT 1:1 INSIGHT ENGINE
//
// RULE: Each warning generates EXACTLY ONE insight.
//       N warnings → N insights. No grouping. No exceptions.
//
// Step 1: collectWarnings(base, sim) — builds an array of warning objects
// Step 2: warningToInsight(warning)  — converts each warning to one insight
// Step 3: validate                   — throws if count mismatches
// ══════════════════════════════════════════════════════════════════════════════

// ── Step 1: Collect all individual warnings ───────────────────────────────────
// Each warning is one independent environmental condition.
// No combining. No grouping.
function collectWarnings(base, sim) {
  const d = sim || base; // use simulated values if available
  const warnings = [];

  // ── Temperature ──────────────────────────────────────────────────────────────
  if (d.temperature >= 45) {
    warnings.push({
      id:       "temp_critical",
      metric:   "temperature",
      value:    d.temperature,
      severity: "Critical",
      title:    "Extreme Heat Alert",
      icon:     "🔥",
    });
  } else if (d.temperature >= 35) {
    warnings.push({
      id:       "temp_high",
      metric:   "temperature",
      value:    d.temperature,
      severity: "High",
      title:    "High Temperature Warning",
      icon:     "🌡️",
    });
  } else if (d.temperature >= 25) {
    warnings.push({
      id:       "temp_medium",
      metric:   "temperature",
      value:    d.temperature,
      severity: "Medium",
      title:    "Rising Temperature",
      icon:     "🌡️",
    });
  } else {
    warnings.push({
      id:       "temp_low",
      metric:   "temperature",
      value:    d.temperature,
      severity: "Positive",
      title:    "Temperature Within Safe Range",
      icon:     "❄️",
    });
  }

  // ── AQI ──────────────────────────────────────────────────────────────────────
  if (d.aqi >= 300) {
    warnings.push({
      id:       "aqi_hazardous",
      metric:   "aqi",
      value:    d.aqi,
      severity: "Critical",
      title:    "Hazardous Air Quality",
      icon:     "☠️",
    });
  } else if (d.aqi >= 200) {
    warnings.push({
      id:       "aqi_very_unhealthy",
      metric:   "aqi",
      value:    d.aqi,
      severity: "High",
      title:    "Very Unhealthy Air Quality",
      icon:     "🏭",
    });
  } else if (d.aqi >= 150) {
    warnings.push({
      id:       "aqi_unhealthy",
      metric:   "aqi",
      value:    d.aqi,
      severity: "High",
      title:    "Unhealthy Air Quality",
      icon:     "🌫️",
    });
  } else if (d.aqi >= 100) {
    warnings.push({
      id:       "aqi_sensitive",
      metric:   "aqi",
      value:    d.aqi,
      severity: "Medium",
      title:    "Moderate Air Pollution",
      icon:     "💨",
    });
  } else {
    warnings.push({
      id:       "aqi_good",
      metric:   "aqi",
      value:    d.aqi,
      severity: "Positive",
      title:    "Good Air Quality",
      icon:     "✅",
    });
  }

  // ── Water ────────────────────────────────────────────────────────────────────
  if (d.water <= 15) {
    warnings.push({
      id:       "water_critical",
      metric:   "water",
      value:    d.water,
      severity: "Critical",
      title:    "Critical Water Scarcity",
      icon:     "🚨",
    });
  } else if (d.water <= 30) {
    warnings.push({
      id:       "water_severe",
      metric:   "water",
      value:    d.water,
      severity: "High",
      title:    "Severe Water Shortage",
      icon:     "💧",
    });
  } else if (d.water <= 50) {
    warnings.push({
      id:       "water_low",
      metric:   "water",
      value:    d.water,
      severity: "Medium",
      title:    "Low Water Availability",
      icon:     "💧",
    });
  } else {
    warnings.push({
      id:       "water_adequate",
      metric:   "water",
      value:    d.water,
      severity: "Positive",
      title:    "Adequate Water Availability",
      icon:     "🌊",
    });
  }

  // ── Forest ───────────────────────────────────────────────────────────────────
  if (d.forest <= 10) {
    warnings.push({
      id:       "forest_critical",
      metric:   "forest",
      value:    d.forest,
      severity: "Critical",
      title:    "Critical Deforestation Alert",
      icon:     "🪓",
    });
  } else if (d.forest <= 20) {
    warnings.push({
      id:       "forest_depleted",
      metric:   "forest",
      value:    d.forest,
      severity: "High",
      title:    "Severe Forest Depletion",
      icon:     "🌳",
    });
  } else if (d.forest <= 33) {
    warnings.push({
      id:       "forest_low",
      metric:   "forest",
      value:    d.forest,
      severity: "Medium",
      title:    "Forest Cover Below Recommended",
      icon:     "🌱",
    });
  } else {
    warnings.push({
      id:       "forest_healthy",
      metric:   "forest",
      value:    d.forest,
      severity: "Positive",
      title:    "Healthy Forest Cover",
      icon:     "🌿",
    });
  }

  // ── Overall Risk Score ────────────────────────────────────────────────────────
  if (d.risk_score >= 80) {
    warnings.push({
      id:       "risk_critical",
      metric:   "risk_score",
      value:    d.risk_score,
      severity: "Critical",
      title:    "Critical Environmental Risk",
      icon:     "🔴",
    });
  } else if (d.risk_score >= 60) {
    warnings.push({
      id:       "risk_high",
      metric:   "risk_score",
      value:    d.risk_score,
      severity: "High",
      title:    "High Environmental Risk",
      icon:     "🟠",
    });
  } else if (d.risk_score >= 40) {
    warnings.push({
      id:       "risk_medium",
      metric:   "risk_score",
      value:    d.risk_score,
      severity: "Medium",
      title:    "Moderate Environmental Risk",
      icon:     "🟡",
    });
  } else {
    warnings.push({
      id:       "risk_low",
      metric:   "risk_score",
      value:    d.risk_score,
      severity: "Positive",
      title:    "Low Environmental Risk",
      icon:     "🟢",
    });
  }

  // ── Simulation comparison warning (only when sim ran) ─────────────────────────
  if (sim) {
    const diff = base.risk_score - sim.risk_score;
    if (diff >= 15) {
      warnings.push({
        id:       "sim_improved",
        metric:   "simulation",
        value:    diff,
        severity: "Positive",
        title:    "Significant Risk Reduction Achieved",
        icon:     "✅",
      });
    } else if (diff >= 5) {
      warnings.push({
        id:       "sim_moderate",
        metric:   "simulation",
        value:    diff,
        severity: "Medium",
        title:    "Moderate Risk Reduction",
        icon:     "📉",
      });
    } else if (diff < -5) {
      warnings.push({
        id:       "sim_worsened",
        metric:   "simulation",
        value:    Math.abs(diff),
        severity: "High",
        title:    "Simulation Worsened Environmental Risk",
        icon:     "📈",
      });
    }
  }

  return warnings;
}

// ── Step 2: Convert ONE warning → ONE insight (strict 1:1) ───────────────────
function warningToInsight(w, base, sim) {
  const v = w.value;

  const INSIGHT_MAP = {
    // Temperature
    temp_critical: {
      cause:   ["Extreme greenhouse gas emissions", "Rapid industrial expansion", "Loss of vegetation cover"],
      impact:  ["Severe heatwaves causing casualties", "Crop failures and food insecurity", "Accelerated ice melt and sea level rise"],
      actions: ["Declare climate emergency and implement immediate carbon cuts", "Deploy urban cooling infrastructure and green roofs", "Issue public health advisories and open cooling centres"],
      expectedImprovement: "Reducing industrial activity by 50% and increasing green cover by 30% can lower temperature by 3–5°C over 20 years.",
    },
    temp_high: {
      cause:   ["High fossil fuel consumption", "Urban heat island effect", "Deforestation reducing natural cooling"],
      impact:  ["Heat stress on agriculture", "Increased energy demand for cooling", "Worsening drought conditions"],
      actions: ["Transition to renewable energy sources", "Implement green building standards", "Launch urban tree-planting programmes"],
      expectedImprovement: "Pollution control combined with reforestation can reduce temperature by 1–3°C over 10 years.",
    },
    temp_medium: {
      cause:   ["Gradual increase in CO₂ emissions", "Urbanisation replacing natural land", "Regional deforestation"],
      impact:  ["Shifting agricultural growing seasons", "Increased wildfire risk", "Pressure on water resources"],
      actions: ["Accelerate carbon reduction policies", "Protect existing forest cover", "Promote energy-efficient transportation"],
      expectedImprovement: "Moderate policy interventions can stabilise temperature rise to under 1.5°C over 15 years.",
    },
    temp_low: {
      cause:   ["Effective climate policies in place", "High renewable energy adoption", "Strong forest conservation"],
      impact:  ["Stable agricultural output", "Reduced heat-related health risks", "Maintained biodiversity"],
      actions: ["Continue and strengthen existing climate policies", "Share best practices with neighbouring regions", "Invest in climate resilience infrastructure"],
      expectedImprovement: "Maintaining current trajectory will keep temperature within the 2°C safe limit.",
    },

    // AQI
    aqi_hazardous: {
      cause:   ["Unregulated industrial emissions", "High vehicle exhaust density", "Biomass burning and waste incineration"],
      impact:  ["Life-threatening respiratory conditions", "Widespread cardiovascular disease", "School and business closures required"],
      actions: ["Emergency industrial shutdown orders", "Implement vehicle ban in affected areas", "Distribute N95 masks to vulnerable populations"],
      expectedImprovement: "Emergency pollution controls can reduce AQI by 150–200 points within 2–4 weeks.",
    },
    aqi_very_unhealthy: {
      cause:   ["Heavy industrial activity without filters", "High traffic congestion", "Seasonal crop burning"],
      impact:  ["Serious health risk for entire population", "Increased hospital admissions", "Long-term lung damage"],
      actions: ["Enforce strict emission standards on factories", "Introduce odd-even vehicle restrictions", "Ban crop residue burning with crop insurance support"],
      expectedImprovement: "Strict enforcement of emission controls can reduce AQI below 150 within 6 months.",
    },
    aqi_unhealthy: {
      cause:   ["Moderate industrial pollution", "Vehicle emissions in urban areas", "Dust and particulate matter"],
      impact:  ["Health risk for sensitive groups (children, elderly)", "Reduced outdoor activity", "Economic losses from health costs"],
      actions: ["Install industrial particulate filters", "Expand public transport to reduce vehicles", "Increase urban tree cover to absorb pollutants"],
      expectedImprovement: "Combined pollution control measures can improve AQI to below 100 within 1 year.",
    },
    aqi_sensitive: {
      cause:   ["Growing vehicle fleet without emission controls", "Small-scale industrial activity", "Construction dust"],
      impact:  ["Discomfort for sensitive individuals", "Minor respiratory irritation", "Reduced tourism appeal"],
      actions: ["Introduce electric vehicle incentives", "Enforce construction dust control regulations", "Plant roadside trees as pollution buffers"],
      expectedImprovement: "Targeted interventions can bring AQI below 100 and protect sensitive populations within 6 months.",
    },
    aqi_good: {
      cause:   ["Strong pollution control regulations", "High electric vehicle adoption", "Dense urban green cover"],
      impact:  ["Low rates of respiratory disease", "High outdoor quality of life", "Attractive environment for residents and businesses"],
      actions: ["Maintain current emission standards", "Continue expanding EV infrastructure", "Monitor for seasonal pollution spikes"],
      expectedImprovement: "Current air quality is within WHO safe limits. Continue monitoring to maintain this standard.",
    },

    // Water
    water_critical: {
      cause:   ["Extreme drought conditions", "Over-extraction of groundwater", "High agricultural water demand"],
      impact:  ["Acute water shortage for drinking and sanitation", "Complete agricultural failure", "Mass displacement risk"],
      actions: ["Deploy emergency desalination and water import", "Impose mandatory water rationing immediately", "Accelerate rainwater harvesting at all buildings"],
      expectedImprovement: "Emergency water management measures can increase availability by 15–20% within 3 months.",
    },
    water_severe: {
      cause:   ["Declining rainfall due to climate change", "Industrial water pollution reducing usable supply", "Population growth increasing demand"],
      impact:  ["Crop failures threatening food supply", "Industrial slowdown due to water shortage", "Community health risks from water stress"],
      actions: ["Introduce mandatory drip irrigation for agriculture", "Implement greywater recycling systems", "Restore natural wetlands and water bodies"],
      expectedImprovement: "Water conservation policies can increase effective availability by 20–30% within 2 years.",
    },
    water_low: {
      cause:   ["Below-average rainfall", "Aging water distribution infrastructure with high losses", "Increasing urban consumption"],
      impact:  ["Agricultural productivity decline", "Groundwater table dropping", "Seasonal water shortages"],
      actions: ["Fix leaking distribution networks to reduce losses", "Introduce tiered water pricing to discourage waste", "Reforest water catchment areas"],
      expectedImprovement: "Infrastructure improvements and conservation can increase water availability by 10–15% within 1 year.",
    },
    water_adequate: {
      cause:   ["Healthy rainfall patterns", "Good water management policies", "Protected watershed areas"],
      impact:  ["Stable agricultural output", "Low water-related health risks", "Sufficient industrial and domestic supply"],
      actions: ["Protect existing watersheds from development", "Invest in water storage for dry seasons", "Continue monitoring groundwater levels"],
      expectedImprovement: "Maintaining current water management will ensure sustainable supply for the next 20+ years.",
    },

    // Forest
    forest_critical: {
      cause:   ["Illegal logging and land clearing", "Agricultural encroachment", "Mining operations removing forest cover"],
      impact:  ["Biodiversity collapse and species extinction", "Severe soil erosion and flooding risk", "Loss of carbon sink accelerating climate change"],
      actions: ["Enact immediate deforestation moratorium", "Deploy forest rangers with satellite monitoring", "Launch emergency afforestation targeting 25% cover"],
      expectedImprovement: "Emergency reforestation combined with strict enforcement can increase forest cover by 5–8% within 5 years.",
    },
    forest_depleted: {
      cause:   ["Sustained commercial logging", "Agricultural land conversion", "Urban expansion into forest areas"],
      impact:  ["Reduced carbon sequestration", "Disrupted water cycles reducing rainfall", "Habitat loss for wildlife"],
      actions: ["Implement mandatory forest cover targets in law", "Provide farmers with agroforestry training and incentives", "Create protected forest corridors between remaining patches"],
      expectedImprovement: "Sustained reforestation efforts can restore 8–12% forest cover within 10 years.",
    },
    forest_low: {
      cause:   ["Slow deforestation from development pressure", "Insufficient reforestation programmes", "Forest degradation from pollution"],
      impact:  ["Below-recommended carbon absorption capacity", "Reduced biodiversity", "Increased soil erosion risk"],
      actions: ["Set national reforestation target of 33%", "Incentivise private landowners to plant trees", "Expand national park and protected area boundaries"],
      expectedImprovement: "Structured reforestation programmes can raise forest cover to the 33% target within 15 years.",
    },
    forest_healthy: {
      cause:   ["Effective forest protection laws", "Community-led conservation initiatives", "Successful reforestation history"],
      impact:  ["Strong carbon sequestration supporting climate goals", "High biodiversity and ecosystem resilience", "Natural water cycle regulation"],
      actions: ["Maintain and enforce existing protection laws", "Expand community forest management programmes", "Use forest as a carbon credit resource"],
      expectedImprovement: "Sustained conservation will maintain ecosystem services valued at billions annually.",
    },

    // Risk Score
    risk_critical: {
      cause:   ["Multiple simultaneous environmental crises", "Lack of coordinated policy response", "Decades of unsustainable development"],
      impact:  ["Immediate threat to public health and safety", "Economic instability from environmental damage", "Potential humanitarian crisis"],
      actions: ["Activate national environmental emergency response plan", "Coordinate cross-sector intervention across all metrics", "Seek international climate assistance and funding"],
      expectedImprovement: "Comprehensive emergency response across all sectors can reduce risk score by 20–30 points within 2 years.",
    },
    risk_high: {
      cause:   ["Elevated pollution, low water availability, and forest depletion acting together", "Insufficient environmental regulation", "High fossil fuel dependency"],
      impact:  ["Declining public health outcomes", "Reduced agricultural productivity", "Worsening climate vulnerability"],
      actions: ["Implement integrated environmental management plan", "Prioritise funding for worst-performing metrics", "Establish environmental monitoring task force"],
      expectedImprovement: "Targeted multi-sector action can reduce risk score to Medium range within 3–5 years.",
    },
    risk_medium: {
      cause:   ["Moderate pressure across multiple environmental factors", "Partial policy implementation", "Growing urbanisation outpacing environmental investment"],
      impact:  ["Some strain on natural resources", "Moderate public health impact", "Manageable but worsening trajectory"],
      actions: ["Strengthen existing environmental policies", "Identify and prioritise the highest-contributing risk factor", "Invest in sustainable urban planning"],
      expectedImprovement: "Targeted policy improvements can push risk score into the Low range within 5 years.",
    },
    risk_low: {
      cause:   ["Effective policies across temperature, AQI, water, and forest management", "Strong institutional capacity for environmental governance", "Community engagement in conservation"],
      impact:  ["Healthy population outcomes", "Resilient economy based on sustainable resources", "High quality of life"],
      actions: ["Maintain all current environmental standards", "Share successful policies with other regions", "Invest in innovation for further improvement"],
      expectedImprovement: "Continuing current trajectory will sustain Low risk for the foreseeable future.",
    },

    // Simulation comparison
    sim_improved: {
      cause:   ["Positive slider adjustments reducing industrial impact and pollution", "Reforestation and water management improvements applied"],
      impact:  ["Demonstrably better environmental outcomes across all metrics", "Proof that policy interventions produce measurable results"],
      actions: ["Present these simulation results to policymakers as evidence", "Implement the most impactful slider changes as real policies", "Set a timeline and KPIs to track real-world progress"],
      expectedImprovement: `Risk score reduced by ${v.toFixed(1)} points in this simulation. Real-world implementation could achieve 60–80% of this improvement within 5–10 years.`,
    },
    sim_moderate: {
      cause:   ["Partial improvements applied through simulation sliders", "Some high-impact factors not yet optimised"],
      impact:  ["Moderate improvement in environmental outcomes", "Demonstrates value of partial policy action"],
      actions: ["Identify which sliders produced the most improvement", "Increase those slider values in the next simulation run", "Focus real-world policy on the highest-impact factors"],
      expectedImprovement: `Risk score reduced by ${v.toFixed(1)} points. Increasing green cover and pollution control further could double this improvement.`,
    },
    sim_worsened: {
      cause:   ["Current slider settings increase industrial activity, pollution, or deforestation", "Negative effects outweigh any positive adjustments"],
      impact:  ["Environmental risk increased beyond baseline prediction", "Demonstrates the cost of poor policy choices"],
      actions: ["Move Population Pressure, Industrial Activity, and Pollution Level sliders RIGHT (toward +100)", "Move Reforestation Level and Water Efficiency sliders RIGHT", "Re-run simulation to verify improvement"],
      expectedImprovement: `Risk increased by ${v.toFixed(1)} points with current settings. Moving all sliders to +50 should reverse this and improve by 10–20 points.`,
    },
  };

  const data = INSIGHT_MAP[w.id] || {
    cause:   ["Environmental factor under stress"],
    impact:  ["Negative impact on ecosystem and human health"],
    actions: ["Implement targeted environmental policy"],
    expectedImprovement: "Targeted action can improve this metric within 1–5 years.",
  };

  return {
    // Display fields (for UI InsightCard component)
    type:     w.severity === "Positive" ? "improvement" : w.severity === "Critical" ? "warning" : w.severity === "High" ? "warning" : w.severity === "Medium" ? "trend" : "suggestion",
    severity: w.severity.toLowerCase(),
    icon:     w.icon,
    title:    w.title,
    message:  data.actions[0], // quick summary for collapsed card view

    // Full structured fields (for expanded card and PDF)
    issue:               w.title,
    metric:              w.metric,
    currentValue:        `${v.toFixed(1)}`,
    cause:               data.cause,
    impact:              data.impact,
    actions:             data.actions,
    expectedImprovement: data.expectedImprovement,
    priority:            w.severity,
  };
}

// ── Step 3: Generate insights with strict 1:1 validation ─────────────────────
function generateInsights(base, sim) {
  // Collect all individual warnings
  const warnings = collectWarnings(base, sim);

  // Convert each warning to exactly one insight
  const insights = warnings.map(w => warningToInsight(w, base, sim));

  // MANDATORY VALIDATION: N warnings must produce N insights
  if (insights.length !== warnings.length) {
    throw new Error(
      `Insight mismatch: ${warnings.length} warnings generated ${insights.length} insights. ` +
      `Each warning must map to exactly one insight.`
    );
  }

  console.log(`[Insights] ${warnings.length} warnings → ${insights.length} insights (1:1 ✅)`);
  return insights;
}

// ── Scenario presets ─────────────────────────────────────────────────────────
function applyScenario(base, f) { return applySimulation(base, f); }

// ── Route handler ─────────────────────────────────────────────────────────────
async function generateReport(req, res, next) {
  try {
    const { country, state, year, simFactors } = req.body;
    if (!country || !year)
      return res.status(400).json({ error:"country and year required" });

    const yr   = parseInt(year, 10);
    const base = await getPrediction(country, state||"", yr);
    const trend= await getTrend(country, state||"", yr);
    const simResult = simFactors ? applySimulation(base, simFactors) : null;

    const report = {
      generated_at: new Date().toISOString(),
      location:     { country, state: state||null },
      year:         yr,
      baseline:     base,
      simulation:   simResult,
      trend,
      ai_insights:  generateInsights(base, simResult),
      scenarios: [
        { label:"Current Trend (No Action)",
          ...applyScenario(base, { populationGrowth:0,  industrialGrowth:0,  pollutionControl:0,  waterUsage:0,  greenCover:0  }) },
        { label:"With Pollution Control",
          ...applyScenario(base, { populationGrowth:0,  industrialGrowth:0,  pollutionControl:70, waterUsage:0,  greenCover:0  }) },
        { label:"With Green Initiative",
          ...applyScenario(base, { populationGrowth:30, industrialGrowth:30, pollutionControl:50, waterUsage:30, greenCover:70 }) },
        { label:"Sustainable Future",
          ...applyScenario(base, { populationGrowth:60, industrialGrowth:70, pollutionControl:90, waterUsage:60, greenCover:90 }) },
      ],
    };

    res.json({ success:true, report });
  } catch(err) { next(err); }
}

module.exports = { generateReport };