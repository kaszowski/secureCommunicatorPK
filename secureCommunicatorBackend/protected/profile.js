const userQueries = require("../database/queries");
const express = require("express");
const router = express.Router();

router.get("/profile", async (req, res) => {
  try {
    const user = await userQueries.GET.getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return user profile without sensitive information
    res.json({
      userId: user.UserId,
      username: user.Username,
      email: user.Email,
      updatedAt: user.UpdatedAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
