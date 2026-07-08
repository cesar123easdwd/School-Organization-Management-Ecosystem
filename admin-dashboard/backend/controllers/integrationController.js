const System         = require("../models/system");
const IntegrationLog = require("../models/integrationLog");
const Transaction    = require("../models/transaction");
const Member         = require("../models/member");
const Event          = require("../models/event");
const Attendance     = require("../models/attendance");

/* ─── Helper: authenticate the incoming system via API key ─────── */
const authenticateSystem = async (apiKey) => {
  if (!apiKey) return null;
  // We use .select("+apiKey") because apiKey is hidden by default
  return System.findOne({ apiKey, isActive: true }).select("+apiKey");
};

/* ─── Helper: write an integration log entry ───────────────────── */
const writeLog = async ({ system, method, endpoint, action, message, level, statusCode, meta, ip }) => {
  try {
    const safeMethod = method || "POST";
    const safeEndpoint = endpoint || "/api/integration/unknown";
    const safeAction = (action || message || "").trim() || `Integration event received via ${safeEndpoint}`;
    const safeLevel = (level || "info").toLowerCase();
    const safeLevelValue = ["success", "warning", "error", "info"].includes(safeLevel) ? safeLevel : "info";

    await IntegrationLog.create({
      system:     system?._id,
      systemName: system?.name ?? "Unknown system",
      method:     safeMethod,
      endpoint:   safeEndpoint,
      action:     safeAction,
      message:    message || safeAction,
      level:      safeLevelValue,
      statusCode: statusCode || 200,
      meta:       meta || {},
      ip,
    });
  } catch (_) {
    // Log writing must never crash the main request
  }
};

/* ══════════════════════════════════════════════════════════════════
   POST /api/integration/ping
   Sub-systems call this to announce they are online.
   Body: { apiKey }
   ══════════════════════════════════════════════════════════════════ */
const ping = async (req, res) => {
  try {
    const system = await authenticateSystem(req.body.apiKey || req.headers["x-api-key"]);
    if (!system) {
      return res.status(401).json({ success: false, message: "Invalid or inactive API key." });
    }

    system.status   = "online";
    system.lastSeen = new Date();
    await system.save({ validateBeforeSave: false });

    await writeLog({
      system,
      method:     "POST",
      endpoint:   "/api/integration/ping",
      action:     `${system.name} came online`,
      level:      "success",
      statusCode: 200,
      ip:         req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Ping received from ${system.name}. Status set to online.`,
      timestamp: new Date(),
    });

  } catch (error) {
    console.error("[integrationController.ping]", error.message);
    res.status(500).json({ success: false, message: "Server error during ping." });
  }
};

/* ══════════════════════════════════════════════════════════════════
   POST /api/integration/push-transaction
   Payments sub-system sends a new sanction/transaction record.
   Headers: x-api-key: <system api key>
   Body: { memberId, memberName, reason, amount, sanctionDate }
   ══════════════════════════════════════════════════════════════════ */
const pushTransaction = async (req, res) => {
  try {
    const system = await authenticateSystem(req.headers["x-api-key"]);
    if (!system) {
      return res.status(401).json({ success: false, message: "Invalid or inactive API key." });
    }

    const { memberId, memberName, reason, amount, sanctionDate } = req.body;
    if (!memberName || !reason || amount == null) {
      return res.status(400).json({
        success: false,
        message: "memberName, reason, and amount are required.",
      });
    }

    const transaction = await Transaction.create({
      memberId,
      memberName,
      reason,
      amount,
      sanctionDate: sanctionDate || new Date(),
      sourceSystem: system._id,
    });

    await writeLog({
      system,
      method:     "POST",
      endpoint:   "/api/integration/push-transaction",
      action:     `New sanction pushed: ${memberName} – ${reason} (₱${amount})`,
      level:      "info",
      statusCode: 201,
      meta:       { transactionId: transaction._id, paymentId: transaction.paymentId },
      ip:         req.ip,
    });

    system.lastSeen = new Date();
    await system.save({ validateBeforeSave: false });

    res.status(201).json({
      success:     true,
      paymentId:   transaction.paymentId,
      transaction: { id: transaction._id, paymentId: transaction.paymentId, status: transaction.status },
    });

  } catch (error) {
    console.error("[integrationController.pushTransaction]", error.message);
    res.status(500).json({ success: false, message: "Failed to push transaction." });
  }
};

/* ══════════════════════════════════════════════════════════════════
   GET /api/integration/logs
   Returns recent integration logs for the activity feed (admin only).
   Query params: ?limit=20&level=success
   ══════════════════════════════════════════════════════════════════ */
const getLogs = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const filter = {};
    if (req.query.level) filter.level = req.query.level;
    if (req.query.system) filter.system = req.query.system;

    const logs = await IntegrationLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("system", "name module");

    const normalizedLogs = logs.map((log) => {
      const plain = log.toObject ? log.toObject() : log;
      return {
        ...plain,
        message: plain.message || plain.action || "Integration event received",
        systemName: plain.systemName || plain.system?.name || "Unknown system",
        method: plain.method || "POST",
        endpoint: plain.endpoint || "/api/integration/unknown",
        level: (plain.level || "info").toLowerCase(),
        createdAt: plain.createdAt || plain.timestamp || new Date(),
      };
    });

    res.status(200).json({ success: true, count: normalizedLogs.length, logs: normalizedLogs });
  } catch (error) {
    console.error("[integrationController.getLogs]", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch logs." });
  }
};

/* ══════════════════════════════════════════════════════════════════
   POST /api/integration/push-member
   Member Registration sub-system pushes a new or updated member record.
   Headers: x-api-key: <Member Registration API key>
   Body: { memberId, firstName, lastName, email, course, year, status }
   ══════════════════════════════════════════════════════════════════ */
const pushMember = async (req, res) => {
  try {
    const system = await authenticateSystem(req.headers["x-api-key"]);
    if (!system) {
      return res.status(401).json({ success: false, message: "Invalid or inactive API key." });
    }

    const { memberId, firstName, lastName, email, course, year, status } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ success: false, message: "firstName and lastName are required." });
    }

    const fullName = `${firstName} ${lastName}`;

    await Member.findOneAndUpdate(
      { memberId: memberId || email || fullName },
      {
        memberId: memberId || email || fullName,
        firstName,
        lastName,
        fullName,
        email,
        course,
        year,
        status,
        sourceSystem: system._id,
        systemName: system.name,
        lastSyncedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await writeLog({
      system,
      method:     "POST",
      endpoint:   "/api/integration/push-member",
      action:     `Member synced: ${fullName}${course ? ` – ${course}` : ""}${year ? ` Year ${year}` : ""}`,
      level:      "info",
      statusCode: 201,
      meta:       { memberId, firstName, lastName, email, course, year, status },
      ip:         req.ip,
    });

    system.lastSeen = new Date();
    system.status   = "online";
    await system.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: `Member "${fullName}" received and logged.`,
      received: { memberId, firstName, lastName, email, course, year, status },
    });

  } catch (error) {
    console.error("[integrationController.pushMember]", error.message);
    res.status(500).json({ success: false, message: "Failed to process member data." });
  }
};

/* ══════════════════════════════════════════════════════════════════
   POST /api/integration/push-event
   Events Management sub-system pushes a new or updated event.
   Headers: x-api-key: <Events Management API key>
   Body: { eventId, title, description, location, date, organizer, status }
   ══════════════════════════════════════════════════════════════════ */
const pushEvent = async (req, res) => {
  try {
    const system = await authenticateSystem(req.headers["x-api-key"]);
    if (!system) {
      return res.status(401).json({ success: false, message: "Invalid or inactive API key." });
    }

    const { eventId, title, description, location, date, organizer, status } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: "Event title is required." });
    }

    await Event.findOneAndUpdate(
      { eventId: eventId || title },
      {
        eventId: eventId || title,
        title,
        description,
        location,
        date: date ? new Date(date) : new Date(),
        organizer,
        status,
        sourceSystem: system._id,
        lastSyncedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await writeLog({
      system,
      method:     "POST",
      endpoint:   "/api/integration/push-event",
      action:     `Event synced: "${title}"${location ? ` at ${location}` : ""}${date ? ` on ${new Date(date).toLocaleDateString()}` : ""}`,
      level:      "info",
      statusCode: 201,
      meta:       { eventId, title, description, location, date, organizer, status },
      ip:         req.ip,
    });

    system.lastSeen = new Date();
    system.status   = "online";
    await system.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: `Event "${title}" received and logged.`,
      received: { eventId, title, location, date, organizer, status },
    });

  } catch (error) {
    console.error("[integrationController.pushEvent]", error.message);
    res.status(500).json({ success: false, message: "Failed to process event data." });
  }
};

/* ══════════════════════════════════════════════════════════════════
   POST /api/integration/push-attendance
   Attendance sub-system pushes an attendance record for an event.
   Headers: x-api-key: <Attendance Management API key>
   Body: { eventId, eventTitle, memberId, memberName, status, remarks }
   ══════════════════════════════════════════════════════════════════ */
const pushAttendance = async (req, res) => {
  try {
    const system = await authenticateSystem(req.headers["x-api-key"]);
    if (!system) {
      return res.status(401).json({ success: false, message: "Invalid or inactive API key." });
    }

    const { eventId, eventTitle, memberId, memberName, status, remarks } = req.body;
    if (!memberName || !eventTitle) {
      return res.status(400).json({ success: false, message: "memberName and eventTitle are required." });
    }

    // If absent — automatically create an unpaid sanction transaction
    let autoSanction = null;
    if (status === "Absent" || status === "absent") {
      autoSanction = await Transaction.create({
        memberName,
        memberId:     memberId || "",
        reason:       `Absence – ${eventTitle}`,
        amount:       50, // default absence penalty — adjust as needed
        sanctionDate: new Date(),
        sourceSystem: system._id,
        notes:        `Auto-generated from Attendance Management for event: ${eventTitle}`,
      });
    }

    await Attendance.create({
      eventId: eventId || eventTitle,
      eventTitle,
      memberId,
      memberName,
      status,
      remarks,
      sourceSystem: system._id,
      lastSyncedAt: new Date(),
    });

    const logMsg = status === "Absent" || status === "absent"
      ? `Attendance: ${memberName} marked ABSENT for "${eventTitle}" → ₱50 sanction auto-created (${autoSanction?.paymentId})`
      : `Attendance: ${memberName} marked ${status || "Present"} for "${eventTitle}"`;

    await writeLog({
      system,
      method:     "POST",
      endpoint:   "/api/integration/push-attendance",
      action:     logMsg,
      level:      status === "Absent" || status === "absent" ? "warning" : "success",
      statusCode: 201,
      meta:       { eventId, eventTitle, memberId, memberName, status, remarks, sanctionId: autoSanction?._id },
      ip:         req.ip,
    });

    system.lastSeen = new Date();
    system.status   = "online";
    await system.save({ validateBeforeSave: false });

    res.status(201).json({
      success:    true,
      message:    `Attendance for "${memberName}" recorded.`,
      status,
      autoSanction: autoSanction
        ? { paymentId: autoSanction.paymentId, amount: autoSanction.amount, status: autoSanction.status }
        : null,
    });

  } catch (error) {
    console.error("[integrationController.pushAttendance]", error.message);
    res.status(500).json({ success: false, message: "Failed to process attendance data." });
  }
};

module.exports = { ping, pushTransaction, pushMember, pushEvent, pushAttendance, getLogs };
