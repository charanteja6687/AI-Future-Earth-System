"""
AI Future Earth - ML Model Definitions
Linear Regression models per country/state
"""
import os, pickle, pandas as pd, numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
DATA_DIR  = os.path.join(os.path.dirname(__file__), "..", "backend", "dataset")

TARGETS = ["temperature", "aqi", "water", "forest"]

# ── Clamp helper ──────────────────────────────────────────────────────────────
def clamp(value, lo, hi):
    """Keep value strictly between lo and hi."""
    return min(max(value, lo), hi)

# ── Sanitise raw ML outputs so values are always physically meaningful ─────────
def sanitise(temp, aqi, water, forest):
    """
    Apply hard physical limits BEFORE any calculation.

    Temperature : -10 °C  to  60 °C   (realistic surface temp range)
    AQI         :   0     to 500       (AQI scale maximum)
    Water       :   0 %   to 100 %
    Forest      :   0 %   to 100 %
    """
    temp   = clamp(temp,   -10,  60)
    aqi    = clamp(aqi,      0, 500)
    water  = clamp(water,    0, 100)
    forest = clamp(forest,   0, 100)
    return temp, aqi, water, forest

def calculate_risk_score(temp, aqi, water, forest):
    # Temperature normalization (10°C to 50°C)
    temp_norm = clamp((temp - 10) / 40, 0, 1) * 100

    # AQI normalization (0 to 500)
    aqi_norm = clamp(aqi / 500, 0, 1) * 100

    # Invert water and forest
    water_inv = 100 - clamp(water, 0, 100)
    forest_inv = 100 - clamp(forest, 0, 100)

    risk = (
        temp_norm * 0.25 +
        aqi_norm  * 0.30 +
        water_inv * 0.20 +
        forest_inv * 0.25
    )

    return round(clamp(risk, 0, 100), 2)
# ── Risk level labels ─────────────────────────────────────────────────────────
def risk_level(score):
    if score <= 40: return "Low"
    if score <= 70: return "Medium"
    return "High"

# ── Model helpers ─────────────────────────────────────────────────────────────
def get_model_key(country, state=None):
    if state:
        return f"india_states_{state.lower().replace(' ', '_')}"
    return f"countries_{country.lower().replace(' ', '_')}"

def load_data(country, state=None):
    if state:
        path = os.path.join(DATA_DIR, "india_states",
                            f"{state.lower().replace(' ', '_')}.csv")
    else:
        path = os.path.join(DATA_DIR, "countries",
                            f"{country.lower().replace(' ', '_')}.csv")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Dataset not found: {path}")
    return pd.read_csv(path)

def build_pipeline():
    return Pipeline([
        ("scaler", StandardScaler()),
        ("model",  LinearRegression())
    ])

def train_one(country, state=None):
    df  = load_data(country, state)
    key = get_model_key(country, state)
    models = {}
    for t in TARGETS:
        p = build_pipeline()
        p.fit(df[["year"]], df[t])
        models[t] = p
    os.makedirs(MODEL_DIR, exist_ok=True)
    with open(os.path.join(MODEL_DIR, f"{key}.pkl"), "wb") as f:
        pickle.dump(models, f)
    return models

def load_models(country, state=None):
    key  = get_model_key(country, state)
    path = os.path.join(MODEL_DIR, f"{key}.pkl")
    if not os.path.exists(path):
        return train_one(country, state)
    with open(path, "rb") as f:
        return pickle.load(f)

# ── Main predict function ─────────────────────────────────────────────────────
def predict(country, state, year):
    models = load_models(country, state if state else None)
    yr     = pd.DataFrame([[year]], columns=["year"])

    # Step 1: get raw ML predictions
    temp   = float(models["temperature"].predict(yr)[0])
    aqi    = float(models["aqi"].predict(yr)[0])
    water  = float(models["water"].predict(yr)[0])
    forest = float(models["forest"].predict(yr)[0])

    # Step 2: sanitise — clamp all values to physical limits
    temp, aqi, water, forest = sanitise(temp, aqi, water, forest)

    # Step 3: calculate risk score on clean values
    rs = calculate_risk_score(temp, aqi, water, forest)

    return {
        "temperature": round(temp,   2),
        "aqi":         round(aqi,    1),
        "water":       round(water,  2),
        "forest":      round(forest, 2),
        "risk_score":  rs,
        "risk_level":  risk_level(rs)
    }

def get_historical(country, state=None):
    df = load_data(country, state)
    return df[df["year"] <= 2024].to_dict("records")

def get_trend(country, state=None, start=2010, end=2050):
    df   = load_data(country, state)
    hist = df[(df["year"] >= start) & (df["year"] <= 2024)].to_dict("records")
    preds = []
    for y in range(2025, end + 1):
        p = predict(country, state if state else "", y)
        p["year"] = y
        preds.append(p)
    return {"historical": hist, "predicted": preds}