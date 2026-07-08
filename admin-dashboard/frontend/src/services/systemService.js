import api from "../api/axios";

/**
 * systemService
 * API calls for connected sub-system management.
 */
const systemService = {
  /**
   * GET /api/systems
   * Returns all registered connected systems.
   */
  getSystems: () =>
    api.get("/systems").then((r) => r.data),

  /**
   * POST /api/systems
   * Register a new connected system. Returns the system + its API key (shown once).
   */
  createSystem: (data) =>
    api.post("/systems", data).then((r) => r.data),

  /**
   * PUT /api/systems/:id
   * Update a system's name, description, baseUrl, or status.
   */
  updateSystem: (id, data) =>
    api.put(`/systems/${id}`, data).then((r) => r.data),

  /**
   * DELETE /api/systems/:id  (superadmin only)
   */
  deleteSystem: (id) =>
    api.delete(`/systems/${id}`).then((r) => r.data),
};

export default systemService;
