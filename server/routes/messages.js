import { Router } from "express";
import Message from "../models/Message.js";

const router = Router();

// GET /api/messages  -> last 50 messages, oldest first.
// REST is the right tool for loading history; WebSocket is for live updates.
router.get("/", async (_req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json(messages.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

export default router;
