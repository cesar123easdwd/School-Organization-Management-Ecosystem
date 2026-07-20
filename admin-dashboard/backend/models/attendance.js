const mongoose = require("mongoose");

/**
 * Attendance Model
 * Stores attendance records created by the Attendance Management integration.
 * Valid statuses: Present | Absent  (Late has been removed from the system)
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
    // Organization is resolved at push time by looking up the member record
    organization: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Present", "Absent"],
      default: "Present",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    timeIn: {
      type: Date,
      default: Date.now,
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
