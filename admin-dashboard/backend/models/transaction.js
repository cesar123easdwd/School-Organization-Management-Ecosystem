const mongoose = require("mongoose");

/**
 * Transaction / Sanction Model
 * Stored in the "sanction" collection.
 *
 * Handles both:
 *   (a) Our API schema:       status, reason, memberName, sanctionDate, paymentId
 *   (b) Teammate's schema:    paymentStatus, isPaid, event (reason text), name,
 *                             memberId/studentId, date (string), attendanceId
 *
 * Valid payment statuses: Paid | Unpaid | Waived
 */
const transactionSchema = new mongoose.Schema(
  {
    // ── Payment ID ────────────────────────────────────────────────
    paymentId: {
      type:   String,
      trim:   true,
      default: "",
    },

    // ── Member info ───────────────────────────────────────────────
    memberId: { type: String, default: "", trim: true },
    studentId: { type: String, default: "", trim: true },
    memberName: { type: String, default: "", trim: true },
    name: { type: String, default: "", trim: true }, // teammate's field

    // ── Reason / description ──────────────────────────────────────
    // Our schema: "reason"
    // Teammate's schema: "event" (full text like "Unexcused Absence - Seminar (JPICE Seminar)")
    reason: { type: String, default: "", trim: true },
    event:  { type: String, default: "", trim: true }, // teammate's reason field

    // ── Amount ────────────────────────────────────────────────────
    amount: { type: Number, default: 0, min: 0 },

    // ── Payment Status ────────────────────────────────────────────
    // Our schema:      status: "Paid" | "Unpaid" | "Waived"
    // Teammate schema: paymentStatus: "paid" | "unpaid", isPaid: true | false
    //                  NOTE: teammate also has status: "absent" (attendance, NOT payment)
    status:        { type: String, trim: true, default: "" },
    paymentStatus: { type: String, trim: true, default: "" },
    isPaid:        { type: Boolean, default: null },

    // ── Dates ─────────────────────────────────────────────────────
    sanctionDate: { type: Date,   default: null },
    paidAt:       { type: Date,   default: null },
    // Teammate stores date as a string "2026-07-20 06:27"
    date:         { type: mongoose.Schema.Types.Mixed, default: null },
    processedAt:  { type: mongoose.Schema.Types.Mixed, default: null },

    // ── References ────────────────────────────────────────────────
    attendanceId: { type: String, default: "" }, // teammate links back to attendance
    sourceSystem: { type: mongoose.Schema.Types.ObjectId, ref: "System", default: null },
    recordedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User",   default: null },

    // ── Misc ──────────────────────────────────────────────────────
    notes:       { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    eventType:   { type: String, default: "", trim: true },
  },
  {
    timestamps: true,
    collection: "sanction",
    strict: false, // preserve all extra fields from teammate's system
  }
);

/* ─── Auto-generate paymentId before first save (only for new records via our API) */
transactionSchema.pre("save", async function () {
  if (this.paymentId) return;
  const count = await mongoose.model("Transaction").countDocuments();
  this.paymentId = `PAY-${String(count + 1).padStart(3, "0")}`;
});

module.exports = mongoose.model("Transaction", transactionSchema);
