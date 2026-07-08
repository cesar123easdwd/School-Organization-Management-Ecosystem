const Transaction = require("../models/transaction");

const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("sourceSystem", "name")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: transactions.length, transactions });
  } catch (error) {
    console.error("[transactionController.getTransactions]", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch transactions." });
  }
};

module.exports = { getTransactions };