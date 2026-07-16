const Transaction = require("../models/transaction");

const normalizeTransactionStatus = (rawStatus) => {
  const value = String(rawStatus || "").trim().toLowerCase();
  if (value === "paid") return "Paid";
  if (value === "waived") return "Waived";
  return "Unpaid";
};

const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("sourceSystem", "name")
      .sort({ createdAt: -1 });

    const normalized = transactions.map((t) => {
      const obj = t.toObject();

      if (!obj.reason) {
        obj.reason = obj.description || obj.event || obj.notes || "No reason provided";
      }

      if (!obj.memberName) {
        obj.memberName = obj.membername || obj.name || "Unknown member";
      }

      obj.status = normalizeTransactionStatus(obj.status);
      return obj;
    });

    res.status(200).json({ success: true, count: normalized.length, transactions: normalized });
  } catch (error) {
    console.error("[transactionController.getTransactions]", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch transactions." });
  }
};

module.exports = { getTransactions };