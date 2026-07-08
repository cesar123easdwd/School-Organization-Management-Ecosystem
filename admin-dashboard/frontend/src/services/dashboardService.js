import api from "../api/axios";

/**
 * dashboardService
 * API calls for the main dashboard statistics and activity feed.
 */
const dashboardService = {
  /**
   * GET /api/dashboard/stats
   * Returns { stats: { totalMembers, onlineSystems, collectedSanctions, unpaidSanctions }, recentLogs }
   */
  getStats: () =>
    api.get("/dashboard/stats").then((r) => r.data),
};

export default dashboardService;
