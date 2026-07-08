const express = require("express");
const router = express.Router();
const { getMembers } = require("../controllers/memberController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/", getMembers);

module.exports = router;
