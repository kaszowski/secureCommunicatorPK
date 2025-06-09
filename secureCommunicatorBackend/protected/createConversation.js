const userQueries = require("../database/queries");
const express = require("express");
const router = express.Router();

router.post("/conversation/create", async (req, res) => {
  const { userToAdd, keyMine, keyOther } = req.body;
  try {
    const otherUser = await userQueries.GET.findUserByUsername(userToAdd);
    if (!otherUser) {
      return res.status(400).json({ error: "User doesn't exist" });
    }

    // Create new conversation (or get existing one)
    const result = await userQueries.POST.createConversation(
      req.userId,
      otherUser.UserId,
      keyMine,
      keyOther
    );

    if (result === false) {
      return res.status(500).json({ error: "Failed to create conversation" });
    }

    // Check if it's an existing conversation (string) or a new one (object)
    if (typeof result === "string") {
      // It's an existing conversation ID
      const existingConversation = await userQueries.GET.getConversationById(
        result
      );
      if (existingConversation) {
        return res.status(200).json({
          newConversation: existingConversation,
          existing: true,
        });
      } else {
        return res.status(400).json({ error: "Conversation already exists" });
      }
    }

    // It's a new conversation
    res.json({ newConversation: result });
  } catch (err) {
    console.error("Error creating conversation:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
