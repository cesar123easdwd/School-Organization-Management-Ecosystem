const mongoose = require("mongoose");

/**
 * System Model
 * Represents a connected sub-system (Member Registration, Events, etc.)
 * that integrates with the Admin Dashboard via API keys.
 */
const systemSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, "System name is required"],
      trim:     true,
      unique:   true,
    },

    description: {
      type:    String,
      default: "",
      trim:    true,
    },

    // Which module does this system belong to?
    module: {
      type:    String,
      enum:    ["member-registration", "events-management", "attendance", "payments", "other"],
      default: "other",
    },

    // API key that the sub-system uses to authenticate its requests
    apiKey: {
      type:     String,
      required: true,
      unique:   true,
      select:   false, // hidden by default — only fetched when explicitly needed
    },

    // Current connection status
    status: {
      type:    String,
      enum:    ["online", "offline", "error"],
      default: "offline",
    },

    // The base URL of the connected system's API
    baseUrl: {
      type:    String,
      default: "",
      trim:    true,
    },

    // Timestamp of the most recent successful ping/request
    lastSeen: {
      type: Date,
    },

    // Which admin registered this system
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
    },

    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("System", systemSchema);
