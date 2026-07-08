const express = require("express");
const router  = express.Router();

const { getStats } = require("../controllers/dashboardController");
const { protect }  = require("../middleware/authMiddleware");

// GET /api/dashboard/stats  — protected, any logged-in admin
router.get("/stats", protect, getStats);

module.exports = router;
