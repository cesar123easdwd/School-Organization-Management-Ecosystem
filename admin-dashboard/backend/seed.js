/**
 * seed.js
 * ────────────────────────────────────────────────────────────────
 * Run ONCE to create the first superadmin account and register the
 * four connected sub-systems with unique API keys.
 *
 * Usage:
 *   node seed.js
 *
 * What it does:
 *   1. Connects to MongoDB
 *   2. Creates a superadmin user (skips if email already exists)
 *   3. Creates the 4 connected sub-system entries with API keys
 *   4. Prints a summary of everything created
 *   5. Disconnects and exits
 * ────────────────────────────────────────────────────────────────
 */

require("dotenv").config();
const mongoose = require("mongoose");
const crypto   = require("crypto");

const User   = require("./models/users");
const System = require("./models/system");

/* ── Configuration ────────────────────────────────────────────── */
const SEED_ADMIN = {
  name:     "Cecilio Cesar Liwag Jr.",
  email:    "admin@schoolorg.com",
  password: "Admin12345",
  role:     "superadmin",
};

const SEED_SYSTEMS = [
  {
    name:        "Member Registration",
    description: "Manages student member profiles and registration",
    module:      "member-registration",
    baseUrl:     "http://localhost:5001",
  },
  {
    name:        "Events Management",
    description: "Creates and tracks organization events",
    module:      "events-management",
    baseUrl:     "http://localhost:5002",
  },
  {
    name:        "Attendance Management",
    description: "Monitors member attendance per event",
    module:      "attendance",
    baseUrl:     "http://localhost:5003",
  },
  {
    name:        "Sanction Payment Management",
    description: "Tracks sanctions, fees, and payment collections",
    module:      "payments",
    baseUrl:     "http://localhost:5004",
  },
];

/* ── Helper ───────────────────────────────────────────────────── */
const generateApiKey = () => `sk_${crypto.randomBytes(24).toString("hex")}`;

const line = () => console.log("─".repeat(60));

/* ── Main ─────────────────────────────────────────────────────── */
async function seed() {
  console.log("\n🌱  School Org – Database Seeder");
  line();

  // 1. Connect
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅  MongoDB connected\n");

  // ── Seed Superadmin ────────────────────────────────────────────
  let adminUser;
  const existing = await User.findOne({ email: SEED_ADMIN.email });

  if (existing) {
    console.log(`ℹ️   Superadmin already exists: ${SEED_ADMIN.email}`);
    adminUser = existing;
  } else {
    adminUser = await User.create(SEED_ADMIN);
    console.log("✅  Superadmin created:");
    console.log(`    Name  : ${adminUser.name}`);
    console.log(`    Email : ${adminUser.email}`);
    console.log(`    Role  : ${adminUser.role}`);
  }

  // ── Seed Connected Systems ─────────────────────────────────────
  console.log("\n🔗  Seeding Connected Systems...\n");

  const createdSystems = [];

  for (const sys of SEED_SYSTEMS) {
    const exists = await System.findOne({ name: sys.name });

    if (exists) {
      console.log(`ℹ️   System already exists: ${sys.name}`);
      createdSystems.push({ name: sys.name, apiKey: "** already exists — not shown again **" });
      continue;
    }

    const apiKey = generateApiKey();
    const created = await System.create({
      ...sys,
      apiKey,
      registeredBy: adminUser._id,
    });

    createdSystems.push({ name: created.name, apiKey });

    console.log(`✅  ${created.name}`);
    console.log(`    Module  : ${created.module}`);
    console.log(`    Base URL: ${created.baseUrl}`);
    console.log(`    API Key : ${apiKey}`);
    console.log();
  }

  // ── Summary ────────────────────────────────────────────────────
  line();
  console.log("\n📋  SEED SUMMARY — Save these API keys now!\n");
  console.log(`🔐  Login Credentials:`);
  console.log(`    Email   : ${SEED_ADMIN.email}`);
  console.log(`    Password: ${SEED_ADMIN.password}`);
  console.log(`    Role    : superadmin\n`);
  console.log("🔑  System API Keys (share with teammates):\n");

  createdSystems.forEach((s) => {
    console.log(`  [${s.name}]`);
    console.log(`  API Key: ${s.apiKey}\n`);
  });

  line();
  console.log("\n⚠️   API keys are hidden in the database after this.");
  console.log("    Copy them now or re-run this script to regenerate.\n");

  await mongoose.disconnect();
  console.log("🔌  MongoDB disconnected. Done!\n");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err.message);
  process.exit(1);
});
