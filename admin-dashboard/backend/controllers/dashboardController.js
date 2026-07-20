const Transaction    = require("../models/transaction");
const IntegrationLog = require("../models/integrationLog");
const Member         = require("../models/member");
const Event          = require("../models/event");

/**
 * Normalize payment status from ANY format the sub-system may use.
 * This MUST stay in sync with transactionController.normalizePaymentStatus.
 *
 * Teammate schema uses:
 *   - paymentStatus: "paid" | "unpaid"  (dedicated payment field)
 *   - isPaid:        true | false        (boolean flag)
 *   - status:        "absent"            (attendance status — NOT payment)
 *
 * Our API schema uses:
 *   - status: "Paid" | "Unpaid" | "Waived"
 */
const normalizePaymentStatus = (row) => {
  // 1. Check our own status — only if it's a real payment value (not "absent")
  const raw = String(row.status || "").trim().toLowerCase();
  if (raw === "paid")   return "Paid";
  if (raw === "waived") return "Waived";
  if (raw === "unpaid") return "Unpaid";

  // 2. Check teammate's dedicated paymentStatus field
  const ps = String(row.paymentStatus || "").trim().toLowerCase();
  if (ps === "paid")   return "Paid";
  if (ps === "waived") return "Waived";
  if (ps === "unpaid") return "Unpaid";

  // 3. Check teammate's boolean isPaid flag
  if (row.isPaid === true)  return "Paid";
  if (row.isPaid === false) return "Unpaid";

  // 4. Safe fallback
  return "Unpaid";
};

/* ══════════════════════════════════════════════════════════════════
   GET /api/dashboard/stats
   Returns:
     - Summary stats (stat cards)
     - Monthly transaction chart data (last 6 months)
     - Sanction status breakdown (pie chart)
     - Integration log level breakdown (bar chart)
   ══════════════════════════════════════════════════════════════════ */
const getStats = async (req, res) => {
  try {
    /* ── Core stat card numbers ──────────────────────────────────── */
    const [totalMembers, totalEvents] = await Promise.all([
      Member.countDocuments(),
      Event.countDocuments(),
    ]);

    /* ── Monthly transactions chart (last 6 months) ──────────────── */
    // NOTE: We do NOT use MongoDB aggregation for collected/unpaid because
    // the teammate's records use paymentStatus/isPaid (not the "status" field).
    // We fetch raw docs and normalize in JS to ensure accuracy.
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const recentTransactions = await Transaction.find({ createdAt: { $gte: sixMonthsAgo } })
      .select("status paymentStatus isPaid amount createdAt")
      .lean();

    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartMonths = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      chartMonths.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: MONTHS[d.getMonth()] });
    }

    const monthlyChart = chartMonths.map(({ year, month, label }) => {
      const monthDocs = recentTransactions.filter((t) => {
        const d = new Date(t.createdAt);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
      let collected = 0;
      let unpaid    = 0;
      monthDocs.forEach((t) => {
        const s = normalizePaymentStatus(t);
        const a = Number(t.amount || 0);
        if (s === "Paid") collected += a;
        else              unpaid    += a;
      });
      return { month: label, collected, unpaid, total: monthDocs.length };
    });

    /* ── Sanction status breakdown (all records) ─────────────────── */
    const allTransactions = await Transaction.find()
      .select("status paymentStatus isPaid amount")
      .lean();

    let normalizedCollectedTotal = 0;
    let normalizedUnpaidTotal    = 0;
    const sanctionBuckets = {};

    allTransactions.forEach((row) => {
      const status = normalizePaymentStatus(row);
      const amount = Number(row.amount || 0);

      if (!sanctionBuckets[status]) {
        sanctionBuckets[status] = { _id: status, value: 0, amount: 0 };
      }
      sanctionBuckets[status].value  += 1;
      sanctionBuckets[status].amount += amount;

      if (status === "Paid") normalizedCollectedTotal += amount;
      else                   normalizedUnpaidTotal    += amount;
    });

    const sanctionPie = Object.values(sanctionBuckets);

    /* ── Integration log level breakdown (bar chart) ─────────────── */
    const logLevelsRaw = await IntegrationLog.aggregate([
      { $group: { _id: "$level", count: { $sum: 1 } } },
    ]);

    /* ── Recent activity (last 24h) count ────────────────────────── */
    const oneDayAgo           = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivityCount = await IntegrationLog.countDocuments({ createdAt: { $gte: oneDayAgo } });
    const todayTransactions   = allTransactions.filter(
      (t) => new Date(t.createdAt) >= oneDayAgo
    ).length;

    res.status(200).json({
      success: true,

      stats: {
        totalMembers,
        totalEvents,
        collectedSanctions: normalizedCollectedTotal,
        unpaidSanctions:    normalizedUnpaidTotal,
        totalTransactions:  allTransactions.length,
        todayActivity:      recentActivityCount,
        todayTransactions,
      },

      charts: {
        monthly:     monthlyChart,
        sanctionPie: sanctionPie.map((s) => ({
          name:   s._id || "Unknown",
          value:  s.value,
          amount: s.amount,
        })),
        logLevels: logLevelsRaw.map((l) => ({
          level: l._id,
          count: l.count,
        })),
      },
    });

  } catch (error) {
    console.error("[dashboardController.getStats]", error.message);
    res.status(500).json({ success: false, message: "Failed to load dashboard stats." });
  }
};

module.exports = { getStats };
