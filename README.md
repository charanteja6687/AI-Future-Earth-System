<<<<<<< HEAD
# 🌍 AI Future Earth Simulation System

> **Predict. Prepare. Protect.**  
> AI-powered environmental predictions for 10 countries and all 28 Indian states, from 2025 to 2100.

---

## 📁 Project Structure

```
ai-future-earth/
├── frontend/              # React app (UI)
│   ├── public/
│   └── src/
│       ├── components/    # Navbar, Sidebar, MapView, Charts…
│       ├── pages/         # Home, Dashboard, Simulation, Analytics, Reports, Settings
│       ├── context/       # AppContext (global state)
│       ├── services/      # Axios API calls
│       └── utils/         # Helpers, coordinates
├── backend/               # Node.js + Express API
│   ├── routes/
│   ├── controllers/
│   ├── services/          # Python bridge (aiService.js)
│   └── dataset/           # Generated CSV files
│       ├── countries/
│       └── india_states/
├── ai/                    # Python ML code
│   ├── dataset_generator.py
│   ├── model.py
│   ├── train.py
│   └── predict.py
├── requirements.txt
└── README.md
```

---

## ⚡ Quick Setup (Step-by-Step)

### Prerequisites

| Tool     | Version  | Install                        |
|----------|----------|--------------------------------|
| Node.js  | ≥ 18     | https://nodejs.org             |
| Python   | ≥ 3.9    | https://python.org             |
| npm      | ≥ 9      | Comes with Node.js             |

---

### Step 1 — Install Python dependencies

```bash
pip install -r requirements.txt
```

---

### Step 2 — Generate datasets

```bash
cd ai
python dataset_generator.py
```

This creates **101 CSV files** (10 countries + 28 Indian states × 101 years each) inside `backend/dataset/`.

---

### Step 3 — Train AI models (optional — auto-trained on first prediction)

```bash
python train.py
```

---

### Step 4 — Install and start the backend

```bash
cd backend
npm install
npm run dev
```

Backend runs at: **http://localhost:5000**

---

### Step 5 — Install and start the frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm start
```

Frontend runs at: **http://localhost:3000**

---

### Step 6 — Open the app

Navigate to **http://localhost:3000** in your browser.

---

## 🔌 API Endpoints

| Method | Endpoint           | Description                        |
|--------|--------------------|------------------------------------|
| POST   | /api/predict       | Get AI prediction for location/year|
| POST   | /api/predict/trend | Get historical + predicted trend   |
| GET    | /api/history       | Get historical CSV data            |
| POST   | /api/report        | Generate full simulation report    |
| GET    | /api/health        | Health check                       |

### Example request

```json
POST /api/predict
{
  "country": "India",
  "state":   "Maharashtra",
  "year":    2040
}
```

### Example response

```json
{
  "success":     true,
  "country":     "India",
  "state":       "Maharashtra",
  "year":        2040,
  "temperature": 31.2,
  "aqi":         242.1,
  "water":       38.4,
  "forest":      18.1,
  "risk_score":  78.3,
  "risk_level":  "High"
}
```

---

## ⚠️ Environmental Risk Score

```
risk_score = (temperature_norm × 0.25)
           + (aqi_norm         × 0.30)
           + ((100 − water)    × 0.20)
           + ((100 − forest)   × 0.25)
```

| Score  | Level  | Color |
|--------|--------|-------|
| 0–40   | Low    | 🟢    |
| 41–70  | Medium | 🟡    |
| 71–100 | High   | 🔴    |

---

## 🌍 Supported Locations

**Countries:** India, USA, China, Russia, Brazil, Germany, UK, Japan, Australia, Canada

**Indian States (28):** Andhra Pradesh, Arunachal Pradesh, Assam, Bihar, Chhattisgarh, Goa,
Gujarat, Haryana, Himachal Pradesh, Jharkhand, Karnataka, Kerala, Madhya Pradesh, Maharashtra,
Manipur, Meghalaya, Mizoram, Nagaland, Odisha, Punjab, Rajasthan, Sikkim, Tamil Nadu, Telangana,
Tripura, Uttar Pradesh, Uttarakhand, West Bengal

---

## 🛠️ Tech Stack

| Layer    | Technology                     |
|----------|--------------------------------|
| Frontend | React 18, React Router, Recharts, Leaflet, jsPDF |
| Backend  | Node.js, Express 4             |
| AI / ML  | Python, scikit-learn (Linear Regression) |
| Data     | pandas, numpy                  |
| Maps     | react-leaflet, OpenStreetMap   |
| Styling  | Custom CSS (dark neon glassmorphism) |

---

## 🐛 Troubleshooting

**Python not found:**  
Set `PYTHON_PATH=python` (or full path) in your environment before starting the backend.

**Datasets missing:**  
Run `python ai/dataset_generator.py` from the project root.

**Port conflicts:**  
- Change backend port: set `PORT=5001` env var  
- Change frontend proxy in `frontend/package.json`

**CORS errors:**  
The backend allows all origins by default. For production, restrict `cors()` in `server.js`.
