const Event = require("../models/event");

/**
 * Normalize event status from any casing/value to one of:
 * Drafted | Active | Postponed | Completed | Cancelled
 */
const VALID_STATUSES = ["Drafted", "Active", "Postponed", "Completed", "Cancelled"];

const normalizeEventStatus = (raw) => {
  if (!raw) return "Drafted";
  const s = String(raw).trim();
  // Capitalize first letter, lowercase the rest
  const cap = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  if (VALID_STATUSES.includes(cap)) return cap;
  // Legacy mappings from old system
  const lower = s.toLowerCase();
  if (lower === "upcoming" || lower === "draft") return "Drafted";
  if (lower === "ongoing")                        return "Active";
  return "Drafted"; // safe fallback
};

/**
 * GET /api/events
 * Returns events with all field variants normalized so the frontend
 * gets consistent data regardless of which sub-system stored the record.
 *
 * Teammate schema:  schedule, venue, organizingClub, type, status (lowercase)
 * Our API schema:   date, location, organizer, status (capitalized)
 */
const getEvents = async (req, res) => {
  try {
    const rawEvents = await Event.find().sort({ createdAt: -1 }).lean();

    const normalized = rawEvents.map((e) => {
      // ── Date / Schedule ──────────────────────────────────────────
      // "schedule" is the teammate's field; "date" is ours.
      // Always expose both as "date" so the frontend only needs to read one.
      const date = e.date || e.schedule || null;

      // ── Location / Venue ─────────────────────────────────────────
      const location = (e.location || "").trim() || (e.venue || "").trim() || "";

      // ── Organizer ────────────────────────────────────────────────
      const organizer = (e.organizer || "").trim() || (e.organizingClub || "").trim() || "";

      // ── Status ───────────────────────────────────────────────────
      const status = normalizeEventStatus(e.status);

      // ── Event ID display ─────────────────────────────────────────
      // Use stored eventId if available; otherwise fall back to _id
      const eventId = (e.eventId || "").trim() || e._id?.toString() || "";

      return {
        ...e,
        date,
        location,
        organizer,
        status,
        eventId,
        // Also keep venue/schedule/organizingClub for any frontend that reads them directly
        venue:          location,
        schedule:       date,
        organizingClub: organizer,
      };
    });

    res.status(200).json({ success: true, count: normalized.length, events: normalized });
  } catch (error) {
    console.error("[eventController.getEvents]", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch events." });
  }
};

module.exports = { getEvents };