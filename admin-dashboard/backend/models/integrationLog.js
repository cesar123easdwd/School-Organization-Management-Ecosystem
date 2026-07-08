const mongoose = require("mongoose");

/**
 * IntegrationLog Model
 * Records every API call made by connected sub-systems.
 * Used to populate the Activity Feed on the dashboard.
 */
const integrationLogSchema = new mongoose.Schema(
  {
    // Which system triggered this log entry
    system: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "System",
    },

    // Human-readable system name (denormalized for fast display)
    systemName: {
      type:    String,
      default: "Unknown System",
    },

    // The HTTP method of the incoming request
    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },

    // The endpoint that was called, e.g. "/api/integration/push-member"
    endpoint: {
      type: String,
    },

    // Short description of what the action did
    action: {
      type:     String,
      required: true,
      trim:     true,
    },

    // "success" | "warning" | "error" | "info"
    level: {
      type:    String,
      enum:    ["success", "warning", "error", "info"],
      default: "info",
    },

    // HTTP response code returned to the sub-system
    statusCode: {
      type: Number,
    },

    // Optional metadata (e.g. record IDs, counts)
    meta: {
      type:    mongoose.Schema.Types.Mixed,
      default: {},
    },

    // IP address of the caller
    ip: {
      type:    String,
      default: "",
    },
  },
  {
    timestamps: true, // createdAt = when the request happened
  }
);

// Keep only the latest 5,000 logs to avoid unbounded growth
integrationLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // auto-delete after 90 days

module.exports = mongoose.model("IntegrationLog", integrationLogSchema);
