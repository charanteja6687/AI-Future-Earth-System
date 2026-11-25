// FILE: backend/controllers/historyController.js
const path = require("path");
const fs   = require("fs");
const csv  = require("csv-parser");

const DATA_DIR = path.resolve(__dirname, "../dataset");

function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath))
      return reject(new Error(`Dataset not found: ${filePath}`));
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", r => rows.push(r))
      .on("end",  ()  => resolve(rows))
      .on("error", reject);
  });
}

async function getHistory(req, res, next) {
  try {
    const { country, state } = req.query;
    let filePath;
    if (state && state !== "null" && state !== "") {
      const slug = state.toLowerCase().replace(/ /g, "_");
      filePath   = path.join(DATA_DIR, "india_states", `${slug}.csv`);
    } else {
      const slug = country.toLowerCase().replace(/ /g, "_");
      filePath   = path.join(DATA_DIR, "countries", `${slug}.csv`);
    }
    const rows = await readCSV(filePath);
    const hist = rows.filter(r => parseInt(r.year) <= 2024);
    res.json({ success: true, data: hist });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHistory };
