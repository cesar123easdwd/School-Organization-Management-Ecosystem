const mongoose = require("mongoose");
const bcrypt   = require("bcrypt");

/**
 * User Model
 * Represents an admin account that can log in to the dashboard.
 * Passwords are hashed with bcrypt before saving (pre-save hook).
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, "Name is required"],
      trim:     true,
    },

    email: {
      type:      String,
      required:  [true, "Email is required"],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },

    password: {
      type:     String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select:   false, // never return password in queries by default
    },

    role: {
      type:    String,
      enum:    ["superadmin", "admin", "viewer"],
      default: "admin",
    },

    isActive: {
      type:    Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
    },

    avatar: {
      type:    String,
      default: "",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

/* ─── Pre-save hook: hash password before storing ──────────────── */
userSchema.pre("save", async function (next) {
  // Only hash if the password field was actually modified
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* ─── Instance method: compare plain text vs hashed password ───── */
userSchema.methods.comparePassword = async function (plainText) {
  return bcrypt.compare(plainText, this.password);
};

module.exports = mongoose.model("User", userSchema);
