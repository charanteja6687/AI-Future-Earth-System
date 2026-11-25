// FILE: backend/routes/history.js
const express           = require("express");
const router            = express.Router();
const { getHistory }    = require("../controllers/historyController");

router.get("/", getHistory);

module.exports = router;
