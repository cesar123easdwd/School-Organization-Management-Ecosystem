const express = require("express");
const router = express.Router();
const { getMembers, updateMemberStatus } = require("../controllers/memberController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

// GET /api/members — list all members with sanction totals
router.get("/", getMembers);

// PATCH /api/members/:id/status — update a member's status (Active | Inactive)
router.patch("/:id/status", updateMemberStatus);

module.exports = router;
