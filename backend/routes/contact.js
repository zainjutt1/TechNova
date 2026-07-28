const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedStatuses = ["new", "read", "replied"];

// @route  POST /api/contact
// @desc   Protected — create a new message, owned by the logged-in user (Create)
router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name, email, message, status } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: "Name, email and message are all required." });
    }

    if (!emailPattern.test(email)) {
      return res.status(400).json({ success: false, error: "Please enter a valid email." });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${allowedStatuses.join(", ")}.`,
      });
    }

    const contact = await Contact.create({
      name,
      email,
      message,
      status,
      createdBy: req.user.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Message created successfully!",
      data: contact,
    });
  })
);

// @route  GET /api/contact
// @desc   Protected — list only the logged-in user's own messages (Read), newest first
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const contacts = await Contact.find({ createdBy: req.user.userId }).sort({ createdAt: -1 });
    return res.json({ success: true, count: contacts.length, data: contacts });
  })
);

// @route  GET /api/contact/:id
// @desc   Protected — fetch a single message, only if it belongs to the logged-in user (Read)
router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const contact = await Contact.findOne({ _id: req.params.id, createdBy: req.user.userId });
    if (!contact) {
      return res.status(404).json({ success: false, error: "Message not found." });
    }
    return res.json({ success: true, data: contact });
  })
);

// @route  PUT /api/contact/:id
// @desc   Protected — update a message the logged-in user owns (Update)
router.put(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name, email, message, status } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ success: false, error: "Name cannot be empty." });
      }
      updates.name = name;
    }

    if (email !== undefined) {
      if (!emailPattern.test(email)) {
        return res.status(400).json({ success: false, error: "Please enter a valid email." });
      }
      updates.email = email;
    }

    if (message !== undefined) {
      if (!message.trim()) {
        return res.status(400).json({ success: false, error: "Message cannot be empty." });
      }
      updates.message = message;
    }

    if (status !== undefined) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Status must be one of: ${allowedStatuses.join(", ")}.`,
        });
      }
      updates.status = status;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: "Nothing to update." });
    }

    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({ success: false, error: "Message not found." });
    }

    return res.json({ success: true, message: "Message updated.", data: contact });
  })
);

// @route  DELETE /api/contact/:id
// @desc   Protected — remove a message the logged-in user owns (Delete)
router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const contact = await Contact.findOneAndDelete({ _id: req.params.id, createdBy: req.user.userId });
    if (!contact) {
      return res.status(404).json({ success: false, error: "Message not found." });
    }
    return res.json({ success: true, message: "Message deleted." });
  })
);

module.exports = router;