const mongoose = require("mongoose");

/**
 * Member Model
 * Stores member records created by the Member Registration integration.
 */
const memberSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      default: "",
      trim: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    course: {
      type: String,
      trim: true,
      default: "",
    },
    year: {
      type: String,
      trim: true,
      default: "",
    },
    organization: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      trim: true,
      default: "Active",
    },
    sourceSystem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "System",
      default: null,
    },
    systemName: {
      type: String,
      trim: true,
      default: "",
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

memberSchema.pre("save", function () {
  this.fullName = `${this.firstName} ${this.lastName}`.trim();
});

module.exports = mongoose.model("Member", memberSchema);
