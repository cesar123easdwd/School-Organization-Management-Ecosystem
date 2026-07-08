const express = require("express");
const router = express.Router();
const { getEvents } = require("../controllers/eventController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/", getEvents);

module.exports = router;
