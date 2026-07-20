const Transaction = require("../models/transaction");

/**
 * Normalize payment status from ANY format the sub-system may use:
 *
 * Teammate schema uses:
 *   - paymentStatus: "paid" | "unpaid"
 *   - isPaid: true | false
 *   - status: "absent" (attendance status — NOT payment status)
 *
 * Our API schema uses:
 *   - status: "Paid" | "Unpaid" | "Waived"
 */
const normalizePaymentStatus = (obj) => {
  // 1. Check our own status field first — but ignore non-payment values like "absent"
  const raw = String(obj.status || "").trim().toLowerCase();
  if (raw === "paid")   return "Paid";
  if (raw === "unpaid") return "Unpaid";
  if (raw === "waived") return "Waived";

  // 2. Check teammate's dedicated paymentStatus field
  const ps = String(obj.paymentStatus || "").trim().toLowerCase();
  if (ps === "paid")   return "Paid";
  if (ps === "unpaid") return "Unpaid";
  if (ps === "waived") return "Waived";

  // 3. Check teammate's boolean isPaid flag
  if (obj.isPaid === true)  return "Paid";
  if (obj.isPaid === false) return "Unpaid";

  // 4. Safe fallback
  return "Unpaid";
};

/**
 * Parse a date that may be:
 *   - A proper Date object / ISO string (our schema)
 *   - A string like "2026-07-20 06:27" (teammate's format — space instead of T)
 *   - null / undefined
 */
const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const str = String(value).trim();
  if (!str) return null;
  // Replace space separator with T to make it ISO-parseable
  const normalized = str.replace(" ", "T");
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * GET /api/transactions
 * Returns payment/sanction records with all field variants normalized.
 *
 * Handles both:
 *   (a) Our API schema:       status, reason, memberName, sanctionDate, paymentId
 *   (b) Teammate's schema:    paymentStatus, isPaid, event (reason), name, date
 */
const getTransactions = async (req, res) => {
  try {
    const raw = await Transaction.find()
      .populate("sourceSystem", "name")
      .sort({ createdAt: -1 })
      .lean();

    const normalized = raw.map((t) => {
      // ── Status ──────────────────────────────────────────────────
      const status = normalizePaymentStatus(t);

      // ── Member name ─────────────────────────────────────────────
      // teammate uses "name" and "memberName" (both present)
      const memberName =
        (t.memberName && t.memberName.trim()) ||
        (t.name      && t.name.trim())       ||
        (t.membername && t.membername.trim()) ||
        "Unknown member";

      // ── Member ID ────────────────────────────────────────────────
      // teammate uses "memberId" or "studentId"
      const memberId = t.memberId || t.studentId || "";

      // ── Reason / Description ─────────────────────────────────────
      // teammate uses "event" for the full reason text
      // e.g. "Unexcused Absence - Seminar (JPICE Seminar)"
      const reason =
        (t.reason      && t.reason.trim())      ||
        (t.event       && t.event.trim())        ||
        (t.description && t.description.trim()) ||
        (t.notes       && t.notes.trim())        ||
        "No reason provided";

      // ── Date ─────────────────────────────────────────────────────
      // teammate stores date as string "2026-07-20 06:27"
      // parse it properly; fall back to createdAt
      const date =
        parseDate(t.sanctionDate) ||
        parseDate(t.date)         ||
        parseDate(t.paidAt)       ||
        parseDate(t.createdAt)    ||
        null;

      // ── Payment ID ───────────────────────────────────────────────
      const paymentId = t.paymentId || t._id?.toString() || "";

      return {
        ...t,
        status,
        memberName,
        memberId,
        reason,
        date,
        paymentId,
        // Keep originals accessible for debugging
        _paymentStatus: t.paymentStatus,
        _isPaid:        t.isPaid,
      };
    });

    res.status(200).json({
      success: true,
      count: normalized.length,
      transactions: normalized,
    });
  } catch (error) {
    console.error("[transactionController.getTransactions]", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch transactions." });
  }
};

module.exports = { getTransactions };