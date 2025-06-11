//const userQueries = require('../knex_db_operations/userQueries');
const userQueries = require("../database/queries");
const express = require("express");
const router = express.Router();

router.get("/messages", async (req, res) => {
  try {
    // Use query parameters instead of body for GET request
    const { conversationId, limit = 50, offset = 0 } = req.query;

    if (!conversationId) {
      return res.status(400).json({ error: "Missing conversationId" });
    }

    const parsedLimit = parseInt(limit);
    const parsedOffset = parseInt(offset);

    if (
      isNaN(parsedLimit) ||
      parsedLimit <= 0 ||
      isNaN(parsedOffset) ||
      parsedOffset < 0
    ) {
      return res.status(400).json({ error: "Invalid limit or offset" });
    }
    const conversationsData = await userQueries.GET.getUserConversations(
      req.userId
    );

    if (
      !conversationsData.some((obj) => obj.ConversationId == conversationId)
    ) {
      return res
        .status(403)
        .json({ error: "User doesnt belong to conversation" });
    }

    const messages = await userQueries.GET.getMessagesInConversation(
      conversationId,
      parsedLimit,
      parsedOffset
    );
    res.json({ messages: messages });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
