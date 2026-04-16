const express = require("express");
const { analyzeData } = require("../controllers/AnalysisController");

const router = express.Router();

router.post("/analyze", analyzeData);

module.exports = router;
