const express = require("express");
const router = express.Router();
const { getAttendance } = require("../controllers/attendanceController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/", getAttendance);

module.exports = router;
