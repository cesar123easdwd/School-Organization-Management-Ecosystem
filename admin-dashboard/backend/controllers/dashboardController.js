const Transaction    = require("../models/transaction");
const System         = require("../models/system");
const IntegrationLog = require("../models/integrationLog");
const User           = require("../models/users");

/* ══════════════════════════════════════════════════════════════════
   GET /api/dashboard/stats
   Returns the four summary numbers shown in the stat cards.
   ══════════════════════════════════════════════════════════════════ */
const getStats = async (req, res) => {
  try {
    // These counts will grow as teammate sub-systems push data in.
    // For now the dashboard reads from its own Transaction collection.
    const [
      totalMembers,       // will come from Member Registration sub-system later
      onlineSystems,
      collectedTotal,
      unpaidTotal,
      recentLogs,
    ] = await Promise.all([
      // Placeholder until the Members collection is wired in from sub-system
      User.countDocuments({ role: { $ne: "superadmin" } }),

      System.countDocuments({ status: "online" }),

      // Sum of all Paid transactions
      Transaction.aggregate([
        { $match: { status: "Paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      // Sum of all Unpaid transactions
      Transaction.aggregate([
        { $match: { status: "Unpaid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      // Last 5 log entries for the activity feed
      IntegrationLog.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("system", "name"),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalMembers,
        onlineSystems,
        collectedSanctions: collectedTotal[0]?.total ?? 0,
        unpaidSanctions:    unpaidTotal[0]?.total   ?? 0,
      },
      recentLogs,
    });

  } catch (error) {
    console.error("[dashboardController.getStats]", error.message);
    res.status(500).json({ success: false, message: "Failed to load dashboard stats." });
  }
};

module.exports = { getStats };
