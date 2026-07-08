const jwt  = require("jsonwebtoken");
const User = require("../models/users");

/**
 * protect
 * Middleware that validates the JWT sent in the Authorization header.
 * Attaches the decoded user object to req.user for downstream handlers.
 *
 * Usage: router.get("/protected", protect, controllerFn)
 */
const protect = async (req, res, next) => {
  try {
    // 1. Check that the Authorization header exists and starts with "Bearer"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // 2. Extract the token string
    const token = authHeader.split(" ")[1];

    // 3. Verify the token using our secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Fetch the user from DB (excludes password thanks to select:false on the model)
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User not found or account is inactive.",
      });
    }

    // 5. Attach user to the request so controllers can use it
    req.user = user;
    next();

  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token has expired. Please log in again." });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token." });
    }
    return res.status(500).json({ success: false, message: "Authentication error." });
  }
};

/**
 * requireRole
 * Optional middleware factory to restrict routes to specific roles.
 * Must be used AFTER protect.
 *
 * Usage: router.delete("/users/:id", protect, requireRole("superadmin"), controllerFn)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of: ${roles.join(", ")}`,
      });
    }
    next();
  };
};

module.exports = { protect, requireRole };
