"""
AI Future Earth - Model Training
Trains Linear Regression models for all countries and Indian states
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from model import train_one

COUNTRIES = ["India","USA","China","Russia","Brazil","Germany","UK","Japan","Australia","Canada"]

INDIA_STATES = [
    "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
    "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
    "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
    "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
    "Tripura","Uttar Pradesh","Uttarakhand","West Bengal"
]

def train_all():
    print("🤖 Training AI models …\n")
    for c in COUNTRIES:
        try:
            train_one(c)
            print(f"  ✓ Country model: {c}")
        except FileNotFoundError as e:
            print(f"  ✗ {c}: {e} — run dataset_generator.py first")

    for s in INDIA_STATES:
        try:
            train_one("India", s)
            print(f"  ✓ State model: {s}")
        except FileNotFoundError as e:
            print(f"  ✗ {s}: {e}")

    print("\n✅ All models trained!")

if __name__ == "__main__":
    train_all()
