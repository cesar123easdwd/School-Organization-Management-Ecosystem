const mongoose = require("mongoose");

/**
 * Attendance Model
 * Stores attendance records created by the Attendance Management integration.
 */
const attendanceSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      default: "",
      trim: true,
    },
    eventTitle: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },
    memberId: {
      type: String,
      default: "",
      trim: true,
    },
    memberName: {
      type: String,
      required: [true, "Member name is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["Present", "Late", "Absent"],
      default: "Present",
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    sourceSystem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "System",
      default: null,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
