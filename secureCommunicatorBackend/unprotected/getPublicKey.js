const userQueries = require("../database/queries");
const express = require("express");
const router = express.Router();

router.get("/key/public", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username)
      return res.status(400).json({ error: "No username provided" });
    const user = await userQueries.GET.findUserByUsername(username);
    if (!user) return res.status(404).json({ error: "User not found" });
    const keys = await userQueries.GET.getUserKeys(user.UserId);
    res.json({ keys: keys.PublicKey });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
