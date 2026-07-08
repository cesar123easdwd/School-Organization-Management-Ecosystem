const jwt  = require("jsonwebtoken");
const User = require("../models/users");

/* ─── Helper: sign a JWT for a user ────────────────────────────── */
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d", // token lasts 7 days
  });

/* ─── Helper: build the standard success response ──────────────── */
const authResponse = (res, statusCode, user, token) => {
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id:       user._id,
      name:     user.name,
      email:    user.email,
      role:     user.role,
      avatar:   user.avatar,
      lastLogin: user.lastLogin,
    },
  });
};

/* ══════════════════════════════════════════════════════════════════
   POST /api/auth/register
   Create a new admin account.
   Only works if there are zero users (first-time setup) OR the
   requester is a superadmin (enforced in the route).
   ══════════════════════════════════════════════════════════════════ */
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password.",
      });
    }

    // Check for duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with that email already exists.",
      });
    }

    // Determine role — only superadmin can create superadmins
    const assignedRole = role === "superadmin" ? "superadmin" : "admin";

    const user = await User.create({ name, email, password, role: assignedRole });
    const token = signToken(user._id);

    return authResponse(res, 201, user, token);

  } catch (error) {
    console.error("[authController.register]", error.message);
    return res.status(500).json({ success: false, message: "Server error during registration." });
  }
};

/* ══════════════════════════════════════════════════════════════════
   POST /api/auth/login
   Authenticate with email + password, receive a JWT.
   ══════════════════════════════════════════════════════════════════ */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password.",
      });
    }

    // Fetch user — we need password so we use .select("+password")
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Contact the system administrator.",
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    return authResponse(res, 200, user, token);

  } catch (error) {
    console.error("[authController.login]", error.message);
    return res.status(500).json({ success: false, message: "Server error during login." });
  }
};

/* ══════════════════════════════════════════════════════════════════
   GET /api/auth/me
   Return the currently logged-in user's profile.
   Requires: protect middleware
   ══════════════════════════════════════════════════════════════════ */
const getMe = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    res.status(200).json({
      success: true,
      user: {
        id:        req.user._id,
        name:      req.user.name,
        email:     req.user.email,
        role:      req.user.role,
        avatar:    req.user.avatar,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error("[authController.getMe]", error.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ══════════════════════════════════════════════════════════════════
   GET /api/auth/users          — list all admin users (superadmin only)
   DELETE /api/auth/users/:id   — deactivate a user (superadmin only)
   ══════════════════════════════════════════════════════════════════ */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-__v").sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    console.error("[authController.getAllUsers]", error.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    // Prevent superadmin from deactivating themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot deactivate your own account." });
    }
    user.isActive = false;
    await user.save({ validateBeforeSave: false });
    res.status(200).json({ success: true, message: `User "${user.name}" deactivated.` });
  } catch (error) {
    console.error("[authController.deactivateUser]", error.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { register, login, getMe, getAllUsers, deactivateUser };
