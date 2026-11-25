// FILE: backend/routes/predict.js
const express    = require("express");
const router     = express.Router();
const { predict, trend } = require("../controllers/predictController");

router.post("/",      predict);
router.post("/trend", trend);

module.exports = router;
