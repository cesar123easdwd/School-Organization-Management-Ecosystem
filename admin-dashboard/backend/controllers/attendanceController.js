const Attendance = require("../models/attendance");

const getAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: attendance.length, attendance });
  } catch (error) {
    console.error("[attendanceController.getAttendance]", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch attendance records." });
  }
};

module.exports = { getAttendance };