const Member = require("../models/member");

const getMembers = async (req, res) => {
  try {
    const members = await Member.find().sort({ lastSyncedAt: -1, createdAt: -1 });
    res.status(200).json({ success: true, count: members.length, members });
  } catch (error) {
    console.error("[memberController.getMembers]", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch members." });
  }
};

module.exports = { getMembers };