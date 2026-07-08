const System         = require("../models/system");
const IntegrationLog = require("../models/integrationLog");
const Transaction    = require("../models/transaction");

/* ─── Helper: authenticate the incoming system via API key ─────── */
const authenticateSystem = async (apiKey) => {
  if (!apiKey) return null;
  // We use .select("+apiKey") because apiKey is hidden by default
  return System.findOne({ apiKey, isActive: true }).select("+apiKey");
};

/* ─── Helper: write an integration log entry ───────────────────── */
const writeLog = async ({ system, method, endpoint, action, level, statusCode, meta, ip }) => {
  try {
    await IntegrationLog.create({
      system:     system?._id,
      systemName: system?.name ?? "Unknown",
      method,
      endpoint,
      action,
      level,
      statusCode,
      meta,
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

    res.status(200).json({ success: true, count: logs.length, logs });
  } catch (error) {
    console.error("[integrationController.getLogs]", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch logs." });
  }
};

module.exports = { ping, pushTransaction, getLogs };
