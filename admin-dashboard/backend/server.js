const express = require("express");
const cors    = require("cors");
require("dotenv").config();

const connectDB = require("./config/database");

// ── Connect to MongoDB ─────────────────────────────────────────────
connectDB();

const app = express();

// ── Global Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health-check Route ────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message:   "School Organization Admin API is Running 🚀",
    status:    "ok",
    timestamp: new Date(),
    routes: {
      auth:        "/api/auth",
      dashboard:   "/api/dashboard",
      systems:     "/api/systems",
      integration: "/api/integration",
    },
  });
});

// ── API Routes ────────────────────────────────────────────────────
app.use("/api/auth",        require("./routes/authRoutes"));
app.use("/api/dashboard",   require("./routes/dashboardRoutes"));
app.use("/api/systems",     require("./routes/systemRoutes"));
app.use("/api/integration", require("./routes/integrationRoutes"));

// ── 404 Handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global Error Handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[Global Error]", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "An unexpected server error occurred.",
  });
});

// ── Start Server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀  Server running on http://localhost:${PORT}`);
  console.log(`📦  Environment: ${process.env.NODE_ENV || "development"}\n`);
});