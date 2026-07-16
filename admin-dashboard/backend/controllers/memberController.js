const Member = require("../models/member");

const getMembers = async (req, res) => {
  try {
    const members = await Member.find().sort({ lastSyncedAt: -1, createdAt: -1 });

    // Normalize fields — records seeded directly into MongoDB may not have
    // gone through the Mongoose pre-save hook, so fullName/year/memberId
    // can be empty even when firstName/yearLevel/studentId have data.
    const normalized = members.map((m) => {
      const obj = m.toObject();

      // Construct fullName if missing
      if (!obj.fullName && obj.firstName) {
        obj.fullName = [obj.firstName, obj.middleName, obj.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
      }

      // Map yearLevel → year if year is empty
      if (!obj.year && obj.yearLevel !== undefined) {
        obj.year = String(obj.yearLevel);
      }

      // Map studentId → memberId if memberId is empty
      if (!obj.memberId && obj.studentId) {
        obj.memberId = obj.studentId;
      }

      // Normalize organization-related fields from older database records
      if (!obj.organization) {
        obj.organization = obj.organizationJoined || obj.organizationName || obj.orgName || obj.organizationInvolved || obj.involvedOrganization || "";
      }

      // Normalize status — prefer membershipStatus if status is missing
      if (!obj.status && obj.membershipStatus) {
        obj.status = obj.membershipStatus;
      }

      return obj;
    });

    res.status(200).json({ success: true, count: normalized.length, members: normalized });
  } catch (error) {
    console.error("[memberController.getMembers]", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch members." });
  }
};

module.exports = { getMembers };
