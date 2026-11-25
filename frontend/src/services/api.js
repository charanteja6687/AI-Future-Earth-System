// FILE: frontend/src/services/api.js
import axios from "axios";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: BASE, timeout: 60000 });

api.interceptors.response.use(
  r => r.data,
  err => Promise.reject(err?.response?.data?.error || err.message || "Request failed")
);

export const predictAPI = {
  predict: (country, state, year) =>
    api.post("/predict", { country, state, year }),
  trend: (country, state, year) =>
    api.post("/predict/trend", { country, state, year }),
};

export const historyAPI = {
  get: (country, state) =>
    api.get("/history", { params: { country, state } }),
};

export const reportAPI = {
  generate: (country, state, year, simFactors) =>
    api.post("/report", { country, state, year, simFactors }),
};

export default api;
