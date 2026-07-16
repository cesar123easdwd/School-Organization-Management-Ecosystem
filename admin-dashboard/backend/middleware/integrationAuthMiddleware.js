const System = require("../models/system");

/**
 * protectIntegration
 * Server-to-server auth middleware for integration endpoints.
 * Accepts either:
 *  - x-api-key: <system api key>
 *  - Authorization: Bearer <system api key>
 */
const protectIntegration = async (req, res, next) => {
  try {
    const headerApiKey = req.headers["x-api-key"];
    const authHeader   = req.headers.authorization;
    const bearerToken  = authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    const apiKey = headerApiKey || bearerToken;
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: "Missing server-to-server credentials. Provide x-api-key or Bearer token.",
      });
    }

    const system = await System.findOne({ apiKey, isActive: true }).select("+apiKey");
    if (!system) {
      return res.status(401).json({
        success: false,
        message: "Invalid or inactive API key.",
      });
    }

    req.system = system;
    next();

  } catch (error) {
    console.error("[integrationAuthMiddleware.protectIntegration]", error.message);
    return res.status(500).json({
      success: false,
      message: "Integration authentication error.",
    });
  }
};

module.exports = { protectIntegration };