// FILE: backend/controllers/predictController.js
const { getPrediction, getTrend } = require("../services/aiService");

async function predict(req, res, next) {
  try {
    const { country, state, year } = req.body;
    if (!country || !year)
      return res.status(400).json({ error: "country and year are required" });

    const yr = parseInt(year, 10);
    if (isNaN(yr) || yr < 2000 || yr > 2100)
      return res.status(400).json({ error: "year must be between 2000 and 2100" });

    const result = await getPrediction(country, state || "", yr);
    res.json({ success: true, country, state: state || null, year: yr, ...result });
  } catch (err) {
    next(err);
  }
}

async function trend(req, res, next) {
  try {
    const { country, state, year } = req.body;
    if (!country || !year)
      return res.status(400).json({ error: "country and year are required" });

    const yr     = parseInt(year, 10);
    const result = await getTrend(country, state || "", yr);
    res.json({ success: true, country, state: state || null, year: yr, ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = { predict, trend };
