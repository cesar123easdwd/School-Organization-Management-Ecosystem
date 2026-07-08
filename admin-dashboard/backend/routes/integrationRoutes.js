const express = require("express");
const router  = express.Router();

const {
  ping,
  pushTransaction,
  pushMember,
  pushEvent,
  pushAttendance,
  getLogs,
} = require("../controllers/integrationController");

const { protect } = require("../middleware/authMiddleware");

/* ─── Sub-system routes (authenticated via x-api-key header) ─────
   These are called by your TEAMMATES' backends, not the browser.
   Each requires a valid x-api-key matching the registered system.
   ──────────────────────────────────────────────────────────────── */

// POST /api/integration/ping
// Any sub-system announces it is online
router.post("/ping", ping);

// POST /api/integration/push-member        ← John Paul (Member Registration)
router.post("/push-member", pushMember);

// POST /api/integration/push-event         ← Timothy (Events Management)
router.post("/push-event", pushEvent);

// POST /api/integration/push-attendance    ← Luis (Attendance Management)
// Note: auto-creates a Transaction if status === "Absent"
router.post("/push-attendance", pushAttendance);

// POST /api/integration/push-transaction   ← Ned (Sanction Payment Management)
router.post("/push-transaction", pushTransaction);

/* ─── Admin dashboard routes (authenticated via JWT) ─────────────
   These are called by the React frontend only.
   ──────────────────────────────────────────────────────────────── */

// GET /api/integration/logs
router.get("/logs", protect, getLogs);

module.exports = router;
