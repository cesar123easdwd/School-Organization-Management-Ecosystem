const express = require("express");
const router  = express.Router();

const {
  ping,
  pushTransaction,
  getLogs,
} = require("../controllers/integrationController");

const { protect } = require("../middleware/authMiddleware");

/* ─── Routes for sub-systems (authenticated via x-api-key header) ─ */

// POST /api/integration/ping
// Sub-system announces it is online
router.post("/ping", ping);

// POST /api/integration/push-transaction
// Payments sub-system sends a new sanction record
router.post("/push-transaction", pushTransaction);

/* ─── Routes for the admin dashboard (authenticated via JWT) ────── */

// GET /api/integration/logs
// Admin fetches the activity feed
router.get("/logs", protect, getLogs);

module.exports = router;
