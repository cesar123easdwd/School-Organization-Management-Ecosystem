const mongoose = require("mongoose");

/**
 * Event Model
 * Stores event records created by the Events Management integration.
 */
const eventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      default: "",
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    organizer: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Upcoming", "Ongoing", "Completed"],
      default: "Upcoming",
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

module.exports = mongoose.model("Event", eventSchema, "events-data");
