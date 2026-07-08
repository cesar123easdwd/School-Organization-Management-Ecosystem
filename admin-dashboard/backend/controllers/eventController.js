const Event = require("../models/event");

const getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1, createdAt: -1 });
    res.status(200).json({ success: true, count: events.length, events });
  } catch (error) {
    console.error("[eventController.getEvents]", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch events." });
  }
};

module.exports = { getEvents };