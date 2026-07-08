const mongoose = require("mongoose");

/**
 * Transaction Model
 * Represents a sanction or fee record for a member.
 * Created by the Payments sub-system or directly by the admin.
 */
const transactionSchema = new mongoose.Schema(
  {
    // Human-readable payment ID, e.g. "PAY-001"
    paymentId: {
      type:   String,
      unique: true,
    },

    // Member information (mirrored from Member Registration sub-system)
    memberId: {
      type:   String,
      default: "",
    },

    memberName: {
      type:     String,
      required: [true, "Member name is required"],
      trim:     true,
    },

    // Description of the violation or fee
    reason: {
      type:     String,
      required: [true, "Reason is required"],
      trim:     true,
    },

    amount: {
      type:     Number,
      required: [true, "Amount is required"],
      min:      [0, "Amount cannot be negative"],
    },

    status: {
      type:    String,
      enum:    ["Unpaid", "Paid", "Waived"],
      default: "Unpaid",
    },

    // Date when the sanction was incurred (not necessarily today)
    sanctionDate: {
      type:    Date,
      default: Date.now,
    },

    // Date when the payment was actually collected
    paidAt: {
      type: Date,
    },

    // Which connected system sent this record (null = entered by admin)
    sourceSystem: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "System",
      default: null,
    },

    // Admin who recorded or last updated this transaction
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
    },

    notes: {
      type:    String,
      default: "",
      trim:    true,
    },
  },
  {
    timestamps: true,
  }
);

/* ─── Auto-generate paymentId before first save ────────────────── */
transactionSchema.pre("save", async function () {
  if (this.paymentId) return; // already set
  const count = await mongoose.model("Transaction").countDocuments();
  this.paymentId = `PAY-${String(count + 1).padStart(3, "0")}`;
});

module.exports = mongoose.model("Transaction", transactionSchema);
