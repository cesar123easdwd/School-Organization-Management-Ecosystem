const mongoose = require("mongoose");

/**
 * Event Model
 * Stores event records. Handles both:
 *   (a) records pushed via our integration API (fields: eventId, title, location, date, organizer, status)
 *   (b) records written directly by the teammate's Events Management system
 *       (fields: _id, title, schedule, venue, type, status, organizingClub, description, capacity)
 *
 * Valid statuses: Drafted | Active | Postponed | Completed | Cancelled
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
    // ── Location / Venue ──────────────────────────────────────────
    // teammate uses "venue"; our integration uses "location"
    location: {
      type: String,
      trim: true,
      default: "",
    },
    venue: {
      type: String,
      trim: true,
      default: "",
    },
    // ── Date / Schedule ───────────────────────────────────────────
    // teammate uses "schedule"; our integration uses "date"
    date: {
      type: Date,
      default: null,
    },
    schedule: {
      type: Date,
      default: null,
    },
    // ── Organizer ─────────────────────────────────────────────────
    // teammate uses "organizingClub"; our integration uses "organizer"
    organizer: {
      type: String,
      trim: true,
      default: "",
    },
    organizingClub: {
      type: String,
      trim: true,
      default: "",
    },
    // ── Event type ────────────────────────────────────────────────
    type: {
      type: String,
      trim: true,
      default: "",
    },
    // ── Status ────────────────────────────────────────────────────
    // Valid values: Drafted | Active | Postponed | Completed | Cancelled
    // Stored lowercase in teammate's DB → normalized on read in controller
    status: {
      type: String,
      trim: true,
      default: "Drafted",
    },
    // ── Misc ──────────────────────────────────────────────────────
    capacity: {
      type: Number,
      default: null,
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
  { timestamps: true, strict: false }  // strict:false so teammate's extra fields (attendanceList etc.) are preserved
);

module.exports = mongoose.model("Event", eventSchema, "events-data");
