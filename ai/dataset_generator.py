"""
AI Future Earth - Dataset Generator
Generates realistic environmental datasets for 10 countries and 28 Indian states
"""
import pandas as pd
import numpy as np
import os

# Seed for reproducibility
np.random.seed(42)

COUNTRIES = {
    "India":      {"base_temp": 28, "base_aqi": 140, "base_water": 55, "base_forest": 24, "temp_rate": 0.045, "aqi_rate": 1.2,  "water_rate": -0.25, "forest_rate": -0.12},
    "USA":        {"base_temp": 12, "base_aqi": 55,  "base_water": 70, "base_forest": 34, "temp_rate": 0.035, "aqi_rate": 0.4,  "water_rate": -0.18, "forest_rate": -0.08},
    "China":      {"base_temp": 14, "base_aqi": 160, "base_water": 45, "base_forest": 22, "temp_rate": 0.050, "aqi_rate": 1.5,  "water_rate": -0.30, "forest_rate": -0.15},
    "Russia":     {"base_temp": 2,  "base_aqi": 50,  "base_water": 80, "base_forest": 49, "temp_rate": 0.060, "aqi_rate": 0.3,  "water_rate": -0.10, "forest_rate": -0.06},
    "Brazil":     {"base_temp": 27, "base_aqi": 60,  "base_water": 75, "base_forest": 58, "temp_rate": 0.040, "aqi_rate": 0.6,  "water_rate": -0.22, "forest_rate": -0.25},
    "Germany":    {"base_temp": 9,  "base_aqi": 35,  "base_water": 78, "base_forest": 32, "temp_rate": 0.030, "aqi_rate": -0.1, "water_rate": -0.12, "forest_rate":  0.02},
    "UK":         {"base_temp": 10, "base_aqi": 40,  "base_water": 75, "base_forest": 13, "temp_rate": 0.032, "aqi_rate": -0.1, "water_rate": -0.10, "forest_rate":  0.03},
    "Japan":      {"base_temp": 15, "base_aqi": 45,  "base_water": 72, "base_forest": 68, "temp_rate": 0.033, "aqi_rate": 0.2,  "water_rate": -0.15, "forest_rate": -0.04},
    "Australia":  {"base_temp": 22, "base_aqi": 30,  "base_water": 52, "base_forest": 19, "temp_rate": 0.042, "aqi_rate": 0.3,  "water_rate": -0.28, "forest_rate": -0.10},
    "Canada":     {"base_temp": 1,  "base_aqi": 28,  "base_water": 85, "base_forest": 38, "temp_rate": 0.055, "aqi_rate": 0.1,  "water_rate": -0.08, "forest_rate": -0.05},
}

INDIA_STATES = {
    "Andhra Pradesh":     {"base_temp": 29, "base_aqi": 120, "base_water": 52, "base_forest": 23},
    "Arunachal Pradesh":  {"base_temp": 18, "base_aqi": 35,  "base_water": 85, "base_forest": 79},
    "Assam":              {"base_temp": 24, "base_aqi": 75,  "base_water": 78, "base_forest": 36},
    "Bihar":              {"base_temp": 27, "base_aqi": 180, "base_water": 48, "base_forest": 7 },
    "Chhattisgarh":       {"base_temp": 28, "base_aqi": 95,  "base_water": 58, "base_forest": 44},
    "Goa":                {"base_temp": 27, "base_aqi": 55,  "base_water": 70, "base_forest": 34},
    "Gujarat":            {"base_temp": 30, "base_aqi": 135, "base_water": 42, "base_forest": 7 },
    "Haryana":            {"base_temp": 24, "base_aqi": 195, "base_water": 43, "base_forest": 3 },
    "Himachal Pradesh":   {"base_temp": 14, "base_aqi": 42,  "base_water": 72, "base_forest": 27},
    "Jharkhand":          {"base_temp": 26, "base_aqi": 130, "base_water": 50, "base_forest": 29},
    "Karnataka":          {"base_temp": 27, "base_aqi": 100, "base_water": 55, "base_forest": 19},
    "Kerala":             {"base_temp": 28, "base_aqi": 65,  "base_water": 72, "base_forest": 29},
    "Madhya Pradesh":     {"base_temp": 28, "base_aqi": 115, "base_water": 50, "base_forest": 25},
    "Maharashtra":        {"base_temp": 28, "base_aqi": 145, "base_water": 50, "base_forest": 16},
    "Manipur":            {"base_temp": 22, "base_aqi": 52,  "base_water": 78, "base_forest": 75},
    "Meghalaya":          {"base_temp": 20, "base_aqi": 40,  "base_water": 88, "base_forest": 76},
    "Mizoram":            {"base_temp": 21, "base_aqi": 35,  "base_water": 82, "base_forest": 85},
    "Nagaland":           {"base_temp": 20, "base_aqi": 38,  "base_water": 80, "base_forest": 78},
    "Odisha":             {"base_temp": 28, "base_aqi": 105, "base_water": 58, "base_forest": 33},
    "Punjab":             {"base_temp": 23, "base_aqi": 185, "base_water": 40, "base_forest": 6 },
    "Rajasthan":          {"base_temp": 32, "base_aqi": 125, "base_water": 32, "base_forest": 5 },
    "Sikkim":             {"base_temp": 15, "base_aqi": 30,  "base_water": 90, "base_forest": 82},
    "Tamil Nadu":         {"base_temp": 30, "base_aqi": 115, "base_water": 48, "base_forest": 17},
    "Telangana":          {"base_temp": 29, "base_aqi": 135, "base_water": 45, "base_forest": 20},
    "Tripura":            {"base_temp": 25, "base_aqi": 58,  "base_water": 80, "base_forest": 59},
    "Uttar Pradesh":      {"base_temp": 26, "base_aqi": 210, "base_water": 45, "base_forest": 6 },
    "Uttarakhand":        {"base_temp": 17, "base_aqi": 55,  "base_water": 68, "base_forest": 45},
    "West Bengal":        {"base_temp": 27, "base_aqi": 155, "base_water": 55, "base_forest": 14},
}

def calculate_risk_score(temp, aqi, water, forest):
    temp_norm  = min(max((temp - 0) / 50, 0), 1) * 100
    aqi_norm   = min(max(aqi / 500, 0), 1) * 100
    water_inv  = 100 - min(max(water, 0), 100)
    forest_inv = 100 - min(max(forest, 0), 100)
    risk = (temp_norm * 0.25) + (aqi_norm * 0.30) + (water_inv * 0.20) + (forest_inv * 0.25)
    return round(min(max(risk, 0), 100), 2)

def risk_level(score):
    if score <= 40:  return "Low"
    if score <= 70:  return "Medium"
    return "High"

def generate_country_dataset(name, params):
    years = list(range(2000, 2101))
    rows  = []
    for y in years:
        offset = y - 2000
        noise  = lambda s: np.random.normal(0, s)
        temp   = params["base_temp"]   + params["temp_rate"]   * offset + noise(0.5)
        aqi    = params["base_aqi"]    + params["aqi_rate"]    * offset + noise(8)
        water  = params["base_water"]  + params["water_rate"]  * offset + noise(1.5)
        forest = params["base_forest"] + params["forest_rate"] * offset + noise(0.5)
        aqi    = max(aqi,    5)
        water  = min(max(water,  5), 100)
        forest = min(max(forest, 2), 95)
        rs     = calculate_risk_score(temp, aqi, water, forest)
        rows.append({
            "country": name, "state": None, "year": y,
            "temperature": round(temp, 2), "aqi": round(aqi, 1),
            "water": round(water, 2), "forest": round(forest, 2),
            "risk_score": rs, "risk_level": risk_level(rs)
        })
    return pd.DataFrame(rows)

def generate_state_dataset(state_name, params):
    years = list(range(2000, 2101))
    rows  = []
    temp_rate   =  0.042 + np.random.uniform(-0.01, 0.01)
    aqi_rate    =  1.0   + np.random.uniform(-0.3,  0.3)
    water_rate  = -0.22  + np.random.uniform(-0.05, 0.05)
    forest_rate = -0.10  + np.random.uniform(-0.03, 0.03)
    for y in years:
        offset = y - 2000
        noise  = lambda s: np.random.normal(0, s)
        temp   = params["base_temp"]   + temp_rate   * offset + noise(0.4)
        aqi    = params["base_aqi"]    + aqi_rate    * offset + noise(7)
        water  = params["base_water"]  + water_rate  * offset + noise(1.2)
        forest = params["base_forest"] + forest_rate * offset + noise(0.4)
        aqi    = max(aqi,    5)
        water  = min(max(water,  5), 100)
        forest = min(max(forest, 2), 95)
        rs     = calculate_risk_score(temp, aqi, water, forest)
        rows.append({
            "country": "India", "state": state_name, "year": y,
            "temperature": round(temp, 2), "aqi": round(aqi, 1),
            "water": round(water, 2), "forest": round(forest, 2),
            "risk_score": rs, "risk_level": risk_level(rs)
        })
    return pd.DataFrame(rows)

def generate_all():
    base = os.path.join(os.path.dirname(__file__), "..", "backend", "dataset")
    os.makedirs(os.path.join(base, "countries"),     exist_ok=True)
    os.makedirs(os.path.join(base, "india_states"),  exist_ok=True)

    for name, params in COUNTRIES.items():
        df   = generate_country_dataset(name, params)
        path = os.path.join(base, "countries", f"{name.lower().replace(' ', '_')}.csv")
        df.to_csv(path, index=False)
        print(f"  ✓ {name} → {len(df)} rows")

    for state, params in INDIA_STATES.items():
        df   = generate_state_dataset(state, params)
        slug = state.lower().replace(" ", "_")
        path = os.path.join(base, "india_states", f"{slug}.csv")
        df.to_csv(path, index=False)
        print(f"  ✓ {state} → {len(df)} rows")

    print(f"\n✅ All datasets generated successfully!")

if __name__ == "__main__":
    print("🌍 Generating AI Future Earth datasets …\n")
    generate_all()
