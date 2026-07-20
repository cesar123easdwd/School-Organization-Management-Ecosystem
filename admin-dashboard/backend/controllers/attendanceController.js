const Attendance = require("../models/attendance");
const Member     = require("../models/member");
const Event      = require("../models/event");

/**
 * Normalize a raw attendance status to only Present or Absent.
 * "Late" is no longer part of the system.
 */
const normalizeAttendanceStatus = (raw) => {
  if (!raw) return "Absent";
  const s = String(raw).trim().toLowerCase();
  if (s === "present") return "Present";
  return "Absent"; // Late → Absent, everything else → Absent
};

/**
 * Resolve organization from a member document.
 * Tries every known field variant used by different sub-systems.
 */
const resolveMemberOrg = (m) => {
  const candidate =
    m.organization ||
    m.organizationId ||
    m.organizationJoined ||
    m.organizationName ||
    m.orgName ||
    m.organizationInvolved ||
    m.involvedOrganization ||
    m.organizationLabel ||
    m.systemName;

  if (typeof candidate === "string") return candidate.trim();
  if (candidate && typeof candidate === "object") {
    return (candidate.name || candidate.label || candidate.title || candidate.value || "").toString().trim();
  }
  if (Array.isArray(candidate)) {
    return candidate
      .map((item) => (typeof item === "string" ? item : item?.name || item?.label || item?.title || item?.value || ""))
      .filter(Boolean)
      .join(", ")
      .trim();
  }
  return "";
};

const normKey = (v) => String(v || "").trim().toLowerCase().replace(/\s+/g, " ");

/**
 * GET /api/attendance
 * Handles records from BOTH:
 *   (a) our own integration API  → fields: eventTitle, eventId, memberId, memberName, timeIn
 *   (b) teammate's direct writes → fields: event (ObjectId), member (ObjectId), studentId, memberName, checkIn
 */
const getAttendance = async (req, res) => {
  try {
    const [rawRecords, members, events] = await Promise.all([
      Attendance.find().sort({ createdAt: -1 }).lean(),
      Member.find().lean(),
      Event.find().lean(),
    ]);

    // ── Build event title lookup map ────────────────────────────────
    // Keys: _id (string), eventId, and the title itself → value: title string
    const eventTitleMap = new Map();
    events.forEach((e) => {
      const title = (e.title || "").trim();
      if (!title) return;
      // Register every possible identifier the attendance record might use
      [
        e._id?.toString(),          // teammate uses event field = ObjectId → match _id
        e.eventId,                  // our integration uses eventId
        title,                      // direct title match
      ]
        .map(normKey)
        .filter(Boolean)
        .forEach((key) => eventTitleMap.set(key, title));
    });

    // ── Build organization lookup map from members ───────────────────
    // Keys: memberId, studentId, fullName, memberName → value: org string
    const orgMap = new Map();
    members.forEach((m) => {
      const org = resolveMemberOrg(m);
      if (!org) return;
      const fullName = m.fullName || (m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : "");
      [m.memberId, m.studentId, fullName, m.memberName]
        .map(normKey)
        .filter(Boolean)
        .forEach((key) => orgMap.set(key, org));
    });

    // ── Enrich each attendance record ───────────────────────────────
    const enriched = rawRecords.map((r) => {
      // ── 1. Resolve event title ──────────────────────────────────
      const eventRef = r.event?.toString() || r.eventId || r.eventTitle || "";
      const resolvedEvent =
        eventTitleMap.get(normKey(eventRef)) ||
        eventTitleMap.get(normKey(r.eventTitle)) ||
        (r.eventTitle && !/^[a-f0-9]{24}$/i.test(r.eventTitle.trim()) ? r.eventTitle.trim() : null) ||
        "—";

      // ── 2. Resolve organization ─────────────────────────────────
      const resolvedOrg =
        (r.organization && r.organization.trim() && r.organization !== "—" ? r.organization : null) ||
        orgMap.get(normKey(r.studentId)) ||
        orgMap.get(normKey(r.memberId)) ||
        orgMap.get(normKey(r.memberName)) ||
        "";

      // ── 3. Normalize status ─────────────────────────────────────
      const resolvedStatus = normalizeAttendanceStatus(r.status);

      // ── 4. Resolve date & time ──────────────────────────────────
      // Teammate schema: checkIn (null for Absent) — no separate date field.
      // Our schema:      timeIn, date.
      // Ultimate fallback: extract creation timestamp from the MongoDB _id ObjectId.
      const idTimestamp = r._id
        ? new Date(parseInt(String(r._id).substring(0, 8), 16) * 1000)
        : null;

      // Use checkIn when available; fall back to the _id creation timestamp
      const timeIn = r.timeIn || r.checkIn || idTimestamp || null;
      const date   = r.date   || r.checkIn || idTimestamp || null;

      // ── 5. Normalize member ID display ──────────────────────────
      const memberId = r.memberId || r.studentId || "";

      return {
        ...r,
        eventTitle:   resolvedEvent,
        organization: resolvedOrg || "—",
        status:       resolvedStatus,
        timeIn,
        date,
        memberId,
      };
    });

    res.status(200).json({ success: true, count: enriched.length, attendance: enriched });
  } catch (error) {
    console.error("[attendanceController.getAttendance]", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch attendance records." });
  }
};

module.exports = { getAttendance };