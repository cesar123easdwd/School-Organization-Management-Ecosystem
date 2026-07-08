import api from "../api/axios";

/**
 * integrationService
 * API calls for the integration layer — logs and sub-system pings.
 */
const integrationService = {
  /**
   * GET /api/integration/logs
   * Returns activity logs from all connected sub-systems.
   * @param {object} params - { limit, level, system }
   */
  getLogs: (params = {}) =>
    api.get("/integration/logs", { params }).then((r) => r.data),

  /**
   * POST /api/integration/ping
   * Announce a sub-system as online (used by sub-system backends, not the admin UI).
   * Exposed here for manual testing from the admin panel if needed.
   */
  ping: (apiKey) =>
    api.post("/integration/ping", { apiKey }).then((r) => r.data),

  /**
   * POST /api/integration/push-transaction
   * Push a new sanction/payment record (called by sub-systems via API key).
   */
  pushTransaction: (data, apiKey) =>
    api.post("/integration/push-transaction", data, {
      headers: { "x-api-key": apiKey },
    }).then((r) => r.data),
};

export default integrationService;
