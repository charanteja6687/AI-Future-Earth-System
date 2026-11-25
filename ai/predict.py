"""
AI Future Earth - Prediction Entry Point
Called by Node.js backend via child_process.

Usage:
    python predict.py <country> <state|_> <year> [action]

action:
    predict  →  returns single prediction JSON        (default)
    trend    →  returns historical + predicted trend JSON

Examples:
    python predict.py India _ 2040
    python predict.py India Maharashtra 2040
    python predict.py India _ 2040 trend
"""
import sys, json, os

sys.path.insert(0, os.path.dirname(__file__))
from model import predict, get_trend, sanitise, calculate_risk_score, risk_level

# ── Simulation factor validation ──────────────────────────────────────────────
def clamp(v, lo, hi):
    return min(max(v, lo), hi)

def apply_simulation(base, sim_factors):
    """
    Apply user slider values to the base prediction.

    sim_factors keys (all optional, default 0):
        populationGrowth  : -100 to +100
        industrialGrowth  : -100 to +100
        pollutionControl  : -100 to +100  (positive = REDUCES pollution)
        waterUsage        : -100 to +100  (positive = MORE usage = LESS water)
        greenCover        : -100 to +100  (positive = MORE trees)

    Each slider moves the metric by a SCALED amount so the range
    -100 to +100 produces sensible real-world changes:

        Temperature  changes by ± 5 °C  max   (industrial / green cover effect)
        AQI          changes by ± 200   max   (pollution control / industrial)
        Water        changes by ± 30 %  max   (water usage / green cover)
        Forest       changes by ± 30 %  max   (green cover / industrial)
    """
    # Read factors; default to 0 if missing
    pg = clamp(float(sim_factors.get("populationGrowth", 0)), -100, 100)
    ig = clamp(float(sim_factors.get("industrialGrowth", 0)), -100, 100)
    pc = clamp(float(sim_factors.get("pollutionControl", 0)), -100, 100)
    wu = clamp(float(sim_factors.get("waterUsage",       0)), -100, 100)
    gc = clamp(float(sim_factors.get("greenCover",       0)), -100, 100)

    # ── Temperature ──────────────────────────────────────────────────────────
    # Industrial growth raises temp; green cover lowers it
    # Scale: ±100 slider → ±5 °C change
    temp_delta = (ig * 0.03) - (gc * 0.02)
    new_temp   = base["temperature"] + temp_delta

    # ── AQI ──────────────────────────────────────────────────────────────────
    # Pollution control reduces AQI; industrial + population growth raises it
    # Scale: ±100 slider → ±200 AQI change
    aqi_delta = -(pc * 2.0) + (ig * 1.5) + (pg * 0.5)
    new_aqi   = base["aqi"] + aqi_delta

    # ── Water ────────────────────────────────────────────────────────────────
    # Higher water usage reduces availability; green cover slightly increases it
    # Scale: ±100 slider → ±30 % change
    water_delta = -(wu * 0.3) + (gc * 0.1)
    new_water   = base["water"] + water_delta

    # ── Forest ───────────────────────────────────────────────────────────────
    # Green cover increases forest; industrial growth reduces it
    # Scale: ±100 slider → ±30 % change
    forest_delta = (gc * 0.3) - (ig * 0.15)
    new_forest   = base["forest"] + forest_delta

    # ── Sanitise: apply hard physical limits ─────────────────────────────────
    new_temp, new_aqi, new_water, new_forest = sanitise(
        new_temp, new_aqi, new_water, new_forest
    )

    # ── Recalculate risk score on clean simulated values ─────────────────────
    rs = calculate_risk_score(new_temp, new_aqi, new_water, new_forest)

    return {
        "temperature": round(new_temp,   2),
        "aqi":         round(new_aqi,    1),
        "water":       round(new_water,  2),
        "forest":      round(new_forest, 2),
        "risk_score":  rs,
        "risk_level":  risk_level(rs)
    }

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    if len(sys.argv) < 4:
        print(json.dumps({
            "error": "Usage: predict.py <country> <state|_> <year> [predict|trend|simulate] [simFactors_json]"
        }))
        sys.exit(1)

    country = sys.argv[1].strip()
    state   = sys.argv[2].strip()
    year    = int(sys.argv[3].strip())
    action  = sys.argv[4].strip() if len(sys.argv) > 4 else "predict"

    # Treat "_", "null", "None", "" as no state
    if state in ("", "_", "null", "None", "undefined"):
        state = None

    # ── Dispatch ──────────────────────────────────────────────────────────────
    if action == "trend":
        result = get_trend(country, state, start=2010, end=year)

    elif action == "simulate":
        # sim_factors passed as JSON string in argv[5]
        sim_factors = {}
        if len(sys.argv) > 5:
            try:
                sim_factors = json.loads(sys.argv[5])
            except json.JSONDecodeError:
                sim_factors = {}

        # First get base prediction, then apply simulation on top
        base   = predict(country, state, year)
        result = apply_simulation(base, sim_factors)
        # Include base for comparison
        result["base"] = base

    else:
        # Default: plain prediction
        result = predict(country, state, year)

    print(json.dumps(result))

if __name__ == "__main__":
    main()