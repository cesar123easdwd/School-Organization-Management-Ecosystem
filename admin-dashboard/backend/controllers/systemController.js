const crypto         = require("crypto");
const System         = require("../models/system");
const IntegrationLog = require("../models/integrationLog");

/* ─── Helper: generate a secure random API key ─────────────────── */
const generateApiKey = () => `sk_${crypto.randomBytes(24).toString("hex")}`;

/* ══════════════════════════════════════════════════════════════════
   GET /api/systems
   List all connected systems (apiKey excluded by default).
   ══════════════════════════════════════════════════════════════════ */
const getSystems = async (req, res) => {
  try {
    const systems = await System.find().populate("registeredBy", "name email").sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: systems.length, systems });
  } catch (error) {
    console.error("[systemController.getSystems]", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch systems." });
  }
};

/* ══════════════════════════════════════════════════════════════════
   POST /api/systems
   Register a new connected sub-system. Generates an API key.
   ══════════════════════════════════════════════════════════════════ */
const createSystem = async (req, res) => {
  try {
    const { name, description, module, baseUrl } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "System name is required." });
    }

    const apiKey = generateApiKey();

    const system = await System.create({
      name,
      description,
      module,
      baseUrl,
      apiKey,
      registeredBy: req.user._id,
    });

    // Return the API key ONCE — it won't be shown again
    res.status(201).json({
      success: true,
      message: "System registered. Save this API key — it will not be shown again.",
      system: {
        id:          system._id,
        name:        system.name,
        description: system.description,
        module:      system.module,
        baseUrl:     system.baseUrl,
        status:      system.status,
        apiKey,       // only time this is exposed
        createdAt:   system.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "A system with that name already exists." });
    }
    console.error("[systemController.createSystem]", error.message);
    res.status(500).json({ success: false, message: "Failed to register system." });
  }
};

/* ══════════════════════════════════════════════════════════════════
   PUT /api/systems/:id
   Update a system's info (name, description, baseUrl, status).
   ══════════════════════════════════════════════════════════════════ */
const updateSystem = async (req, res) => {
  try {
    const allowed = ["name", "description", "baseUrl", "status", "isActive"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const system = await System.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: "after",
      runValidators:  true,
    });

    if (!system) return res.status(404).json({ success: false, message: "System not found." });

    res.status(200).json({ success: true, system });
  } catch (error) {
    console.error("[systemController.updateSystem]", error.message);
    res.status(500).json({ success: false, message: "Failed to update system." });
  }
};

/* ══════════════════════════════════════════════════════════════════
   DELETE /api/systems/:id
   Remove a system and its associated logs.
   ══════════════════════════════════════════════════════════════════ */
const deleteSystem = async (req, res) => {
  try {
    const system = await System.findByIdAndDelete(req.params.id);
    if (!system) return res.status(404).json({ success: false, message: "System not found." });

    // Clean up logs from this system
    await IntegrationLog.deleteMany({ system: req.params.id });

    res.status(200).json({ success: true, message: `System "${system.name}" removed.` });
  } catch (error) {
    console.error("[systemController.deleteSystem]", error.message);
    res.status(500).json({ success: false, message: "Failed to delete system." });
  }
};

module.exports = { getSystems, createSystem, updateSystem, deleteSystem };
