const Member = require("../models/member");
const Transaction = require("../models/transaction");

const normalizeLookupKey = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

const normalizeTransactionStatus = (rawStatus) => {
  const value = String(rawStatus || "").trim().toLowerCase();
  if (value === "paid") return "Paid";
  if (value === "waived") return "Waived";
  return "Unpaid";
};

const formatSanctionTotal = (amount) => `₱${Number(amount || 0).toLocaleString("en-PH")}`;

const normalizeOrganization = (member) => {
  const candidate =
    member.organization ||
    member.organizationId ||
    member.organizationJoined ||
    member.organizationName ||
    member.orgName ||
    member.organizationInvolved ||
    member.involvedOrganization ||
    member.organizationLabel ||
    member.systemName;

  if (typeof candidate === "string") {
    return candidate.trim();
  }

  if (candidate && typeof candidate === "object") {
    return (
      candidate.name ||
      candidate.label ||
      candidate.title ||
      candidate.value ||
      ""
    ).toString().trim();
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

const getMembers = async (req, res) => {
  try {
    const [members, transactions] = await Promise.all([
      Member.find().sort({ lastSyncedAt: -1, createdAt: -1 }),
      Transaction.find().select("memberId memberName amount status").lean(),
    ]);

    const sanctionTotals = transactions.reduce((totals, transaction) => {
      const amount = Number(transaction.amount || 0);
      const status = normalizeTransactionStatus(transaction.status);

      if (!Number.isFinite(amount) || amount === 0 || status !== "Unpaid") {
        return totals;
      }

      const keys = [transaction.memberId, transaction.memberName]
        .map(normalizeLookupKey)
        .filter(Boolean);

      keys.forEach((key) => {
        totals.set(key, (totals.get(key) || 0) + amount);
      });

      return totals;
    }, new Map());

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
        obj.organization = normalizeOrganization(obj);
      }

      if (!obj.organization && obj.organizationId) {
        obj.organization = String(obj.organizationId).trim();
      }

      if (!obj.organizationId && obj.organization) {
        obj.organizationId = String(obj.organization).trim();
      }

      if (obj.organization && typeof obj.organization !== "string") {
        obj.organization = normalizeOrganization(obj);
      }

      // Normalize status — prefer membershipStatus if status is missing
      if (!obj.status && obj.membershipStatus) {
        obj.status = obj.membershipStatus;
      }

      if (!obj.membershipStatus && obj.status) {
        obj.membershipStatus = obj.status;
      }

      const sanctionKeyCandidates = [obj.memberId, obj.fullName, obj.memberName]
        .map(normalizeLookupKey)
        .filter(Boolean);
      const sanctionTotal = sanctionKeyCandidates.reduce((total, key) => {
        if (total > 0) return total;
        return sanctionTotals.get(key) || 0;
      }, 0);

      obj.sanctionTotal = sanctionTotal;
      obj.sanctions = formatSanctionTotal(sanctionTotal);

      return obj;
    });

    res.status(200).json({ success: true, count: normalized.length, members: normalized });
  } catch (error) {
    console.error("[memberController.getMembers]", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch members." });
  }
};

module.exports = { getMembers };
