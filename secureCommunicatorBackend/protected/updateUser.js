//const userQueries = require('../knex_db_operations/userQueries');
const userQueries = require("../database/queries");
const express = require("express");
const router = express.Router();

router.post("/updateUser", async (req, res) => {
  try {
    const { updates } = req.body;
    if (!updates) return res.status(400).json({ error: "No updates provided" });

    const changed = await userQueries.UPDATE.updateUser(req.userId, updates);
    res.json({ success: changed });
  } catch (err) {
    console.error("Error updating user:", err.message);

    // Send more specific error messages to the client
    if (err.message === "Podane obecne hasło jest nieprawidłowe.") {
      return res.status(401).json({ error: "Current password is incorrect" });
    } else if (
      err.message === "Nowe hasło nie może być takie samo jak obecne."
    ) {
      return res
        .status(400)
        .json({ error: "New password cannot be the same as current password" });
    } else if (err.message === "Nazwa użytkownika jest już zajęta.") {
      return res.status(409).json({ error: "Username is already taken" });
    } else if (err.message === "Adres email jest już używany.") {
      return res.status(409).json({ error: "Email is already in use" });
    }

    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

module.exports = router;
