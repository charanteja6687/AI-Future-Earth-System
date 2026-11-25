// FILE: backend/server.js
const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const path       = require("path");

const predictRoutes  = require("./routes/predict");
const historyRoutes  = require("./routes/history");
const reportRoutes   = require("./routes/report");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: "*" }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static datasets (optional direct access) ─────────────────────────────────
app.use("/datasets", express.static(path.join(__dirname, "dataset")));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/predict", predictRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/report",  reportRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🌍 AI Future Earth backend running on http://localhost:${PORT}`);
});

module.exports = app;
