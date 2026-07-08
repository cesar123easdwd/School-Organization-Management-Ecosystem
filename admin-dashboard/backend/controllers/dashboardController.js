const Transaction    = require("../models/transaction");
const System         = require("../models/system");
const IntegrationLog = require("../models/integrationLog");
const User           = require("../models/users");

const ONLINE_STATUS_WINDOW_MS = 5 * 60 * 1000;

const getRealtimeSystemStatus = (system) => {
  if (!system?.lastSeen) return 'offline';
  if (system.status === 'error') return 'error';
  return (Date.now() - new Date(system.lastSeen).getTime()) <= ONLINE_STATUS_WINDOW_MS ? 'online' : 'offline';
};

/* ══════════════════════════════════════════════════════════════════
   GET /api/dashboard/stats
   Returns:
     - 4 summary stats (stat cards)
     - Recent activity logs
     - Monthly transaction chart data (last 6 months)
     - Sanction status breakdown (pie chart)
     - Integration log level breakdown (bar chart)
     - System uptime summary
   ══════════════════════════════════════════════════════════════════ */
const getStats = async (req, res) => {
  try {
    /* ── Core stat card numbers ──────────────────────────────────── */
    const [
      totalMembers,
      collectedTotal,
      unpaidTotal,
      recentLogs,
      allSystems,
    ] = await Promise.all([
      // Member count from push-member integration logs
      IntegrationLog.distinct("meta.memberId", { endpoint: "/api/integration/push-member" })
        .then(ids => ids.filter(Boolean).length)
        .catch(() => 0),

      Transaction.aggregate([
        { $match: { status: "Paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      Transaction.aggregate([
        { $match: { status: "Unpaid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      IntegrationLog.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate("system", "name"),

      System.find().select("name status module lastSeen"),
    ]);

    const allSystemsWithStatus = allSystems.map((sys) => {
      const obj = sys.toObject();
      obj.status = getRealtimeSystemStatus(obj);
      return obj;
    });

    const onlineSystems = allSystemsWithStatus.filter((sys) => sys.status === 'online').length;

    /* ── Monthly transactions chart (last 6 months) ──────────────── */
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTransactions = await Transaction.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year:  { $year:  "$createdAt" },
            month: { $month: "$createdAt" },
          },
          collected: { $sum: { $cond: [{ $eq: ["$status", "Paid"]   }, "$amount", 0] } },
          unpaid:    { $sum: { $cond: [{ $eq: ["$status", "Unpaid"] }, "$amount", 0] } },
          count:     { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Fill in months with no data so the chart has a continuous axis
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartMonths = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      chartMonths.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: MONTHS[d.getMonth()] });
    }

    const monthlyChart = chartMonths.map(m => {
      const found = monthlyTransactions.find(t => t._id.year === m.year && t._id.month === m.month);
      return {
        month:     m.label,
        collected: found?.collected ?? 0,
        unpaid:    found?.unpaid    ?? 0,
        total:     found?.count     ?? 0,
      };
    });

    /* ── Sanction status pie chart ───────────────────────────────── */
    const sanctionPie = await Transaction.aggregate([
      { $group: { _id: "$status", value: { $sum: 1 }, amount: { $sum: "$amount" } } },
    ]);

    /* ── Integration log level breakdown (bar chart) ─────────────── */
    const logLevels = await IntegrationLog.aggregate([
      { $group: { _id: "$level", count: { $sum: 1 } } },
    ]);

    /* ── Recent activity (last 24h) count ────────────────────────── */
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivityCount = await IntegrationLog.countDocuments({ createdAt: { $gte: oneDayAgo } });

    /* ── Total events and members from logs ──────────────────────── */
    const totalEvents = await IntegrationLog.countDocuments({ endpoint: "/api/integration/push-event" });

    const totalTransactions = await Transaction.countDocuments();
    const todayTransactions = await Transaction.countDocuments({ createdAt: { $gte: oneDayAgo } });

    res.status(200).json({
      success: true,

      stats: {
        totalMembers:       await IntegrationLog.distinct("meta.firstName", { endpoint: "/api/integration/push-member" }).then(a => a.filter(Boolean).length).catch(() => 0),
        onlineSystems,
        collectedSanctions: collectedTotal[0]?.total ?? 0,
        unpaidSanctions:    unpaidTotal[0]?.total    ?? 0,
        totalEvents,
        totalTransactions,
        todayActivity:      recentActivityCount,
        todayTransactions,
      },

      systems:     allSystemsWithStatus,
      recentLogs,

      charts: {
        monthly:     monthlyChart,
        sanctionPie: sanctionPie.map(s => ({
          name:   s._id || "Unknown",
          value:  s.value,
          amount: s.amount,
        })),
        logLevels: logLevels.map(l => ({
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
