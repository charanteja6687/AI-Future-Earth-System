// FILE: frontend/src/context/AppContext.js
import React, { createContext, useContext, useState, useCallback } from "react";
import { predictAPI, reportAPI } from "../services/api";

const AppContext = createContext();

export const COUNTRIES = ["India","USA","China","Russia","Brazil","Germany","UK","Japan","Australia","Canada"];
export const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
];

const DEFAULT_SIM = {
  populationGrowth: 0,
  industrialGrowth: 0,
  pollutionControl: 0,
  waterUsage:       0,
  greenCover:       0,
};

// ── Initial values — single source of truth for reset ─────────────────────────
const INITIAL = {
  country:        "India",
  state:          "Maharashtra",
  year:           2040,
  prediction:     null,
  trendData:      null,
  simFactors:     { ...DEFAULT_SIM },
  simResult:      null,
  report:         null,
  simulationData: null,
  error:          null,
  theme:          "dark",
  settings: {
    modelType:          "Linear Regression",
    confidenceLevel:    "95%",
    tempUnit:           "°C",
    predictionInterval: "Yearly",
    language:           "English",
  },
};

export function AppProvider({ children }) {
  const [country,        setCountry]        = useState(INITIAL.country);
  const [state,          setState]          = useState(INITIAL.state);
  const [year,           setYear]           = useState(INITIAL.year);
  const [prediction,     setPrediction]     = useState(INITIAL.prediction);
  const [trendData,      setTrendData]      = useState(INITIAL.trendData);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(INITIAL.error);
  const [simFactors,     setSimFactors]     = useState({ ...INITIAL.simFactors });
  const [simResult,      setSimResult]      = useState(INITIAL.simResult);
  const [report,         setReport]         = useState(INITIAL.report);
  const [simulationData, setSimulationData] = useState(INITIAL.simulationData);
  const [theme,          setTheme]          = useState(INITIAL.theme);
  const [settings,       setSettings]       = useState({ ...INITIAL.settings });

  // ── Run AI prediction ────────────────────────────────────────────────────────
  const runPrediction = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const stateParam = country === "India" ? state : "";
      const [pred, trend] = await Promise.all([
        predictAPI.predict(country, stateParam, year),
        predictAPI.trend(country,   stateParam, year),
      ]);
      setPrediction(pred);
      setTrendData(trend);
      setSimResult(null);
      setReport(null);
      setSimulationData({ country, state: stateParam, year });
    } catch(err) { setError(String(err)); }
    finally { setLoading(false); }
  }, [country, state, year]);

  // ── Run simulation ───────────────────────────────────────────────────────────
  const runSimulation = useCallback(async () => {
    if (!prediction) return;
    setLoading(true); setError(null);
    try {
      const stateParam = country === "India" ? state : "";
      const result = await reportAPI.generate(country, stateParam, year, simFactors);
      setSimResult(result.report.simulation);
      setReport(result.report);
    } catch(err) { setError(String(err)); }
    finally { setLoading(false); }
  }, [country, state, year, simFactors, prediction]);

  // ── Reset simulation factors ─────────────────────────────────────────────────
  const resetSimFactors = useCallback(() => {
    setSimFactors({ ...DEFAULT_SIM });
    setSimResult(null);
    setReport(null);
  }, []);

  // ── FULL APP RESET — clears ALL state back to initial values ─────────────────
  // Called by "Start New Simulation" button on Reports page.
  // After this, caller should navigate("/") for a clean fresh start.
  const resetApp = useCallback(() => {
    setCountry(INITIAL.country);
    setState(INITIAL.state);
    setYear(INITIAL.year);
    setPrediction(INITIAL.prediction);
    setTrendData(INITIAL.trendData);
    setSimFactors({ ...INITIAL.simFactors });
    setSimResult(INITIAL.simResult);
    setReport(INITIAL.report);
    setSimulationData(INITIAL.simulationData);
    setError(INITIAL.error);
  }, []);

  const value = {
    country, setCountry,
    state,   setState,
    year,    setYear,
    prediction, setPrediction,
    trendData,  setTrendData,
    loading, error,
    simFactors, setSimFactors,
    simResult,  setSimResult,
    report,     setReport,
    simulationData, setSimulationData,
    theme,    setTheme,
    settings, setSettings,
    runPrediction,
    runSimulation,
    resetSimFactors,
    resetApp,           // ← exported so any page can trigger full reset
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);