const express = require("express");
const router  = express.Router();

const {
  getSystems,
  createSystem,
  updateSystem,
  deleteSystem,
} = require("../controllers/systemController");

const { protect, requireRole } = require("../middleware/authMiddleware");

// All system routes are protected
router.use(protect);

// GET  /api/systems        — list all systems
router.get("/", getSystems);

// POST /api/systems        — register a new system (admin+)
router.post("/", createSystem);

// PUT  /api/systems/:id    — update a system
router.put("/:id", updateSystem);

// DELETE /api/systems/:id  — remove a system (superadmin only)
router.delete("/:id", requireRole("superadmin"), deleteSystem);

module.exports = router;
