const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");

router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: "All fields are required." });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ success: false, error: "Please enter a valid email." });
    }

    const contact = await Contact.create({ name, email, message });

    return res.status(201).json({
      success: true,
      message: "Message saved successfully!",
      data: contact,
    });
  } catch (err) {
    console.error("Error saving contact:", err.message);
    return res.status(500).json({ success: false, error: "Server error. Please try again later." });
  }
});

router.get("/", async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    return res.json({ success: true, count: contacts.length, data: contacts });
  } catch (err) {
    console.error("Error fetching contacts:", err.message);
    return res.status(500).json({ success: false, error: "Server error." });
  }
});

module.exports = router;
