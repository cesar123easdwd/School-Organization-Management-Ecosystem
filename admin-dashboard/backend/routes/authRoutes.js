const express = require("express");
const router  = express.Router();

const {
  register,
  login,
  getMe,
  getAllUsers,
  deactivateUser,
} = require("../controllers/authController");

const { protect, requireRole } = require("../middleware/authMiddleware");

/* ─── Public routes (no token required) ────────────────────────── */

// POST /api/auth/register
// First-time setup or superadmin creating a new admin
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

/* ─── Protected routes (valid JWT required) ─────────────────────── */

// GET /api/auth/me  — get own profile
router.get("/me", protect, getMe);

// GET /api/auth/users  — superadmin only
router.get("/users", protect, requireRole("superadmin", "admin"), getAllUsers);

// DELETE /api/auth/users/:id  — superadmin only
router.delete("/users/:id", protect, requireRole("superadmin"), deactivateUser);

module.exports = router;
