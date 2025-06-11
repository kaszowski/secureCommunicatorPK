const jwt = require("jsonwebtoken");
//const userQueries = require('../knex_db_operations/userQueries');
const userQueries = require("../database/queries/index");
const express = require("express");
const { SECRET_KEY, tokenLifeInMinutes } = require("../shared");
const router = express.Router();

router.post("/login", async (req, res) => {
  // Dodaj async
  const { username, password } = req.body;

  // Basic input validation
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Invalid input format" });
  }
  // Validate that password is hashed (should be hex string of expected length)
  if (!/^[a-f0-9]{64}$/i.test(password)) {
    return res
      .status(400)
      .json({ error: "Password must be properly hashed on client-side" });
  }

  try {
    // Użyj tabeli 'User' i kolumny 'user_id' oraz 'password_hash'
    //const user = await knex('User').where({ username: username }).first();
    const user = await userQueries.POST.loginUser(username, password);
    if (user) {
      const token = jwt.sign({ userId: user }, SECRET_KEY, {
        expiresIn: `${tokenLifeInMinutes}m`,
      });
      const isMobile = req.headers["x-client-type"] === "mobile";
      const expiresAt = Date.now() + tokenLifeInMinutes * 60 * 1000;
      if (isMobile) {
        return res.json({ token: token, expiresAt: expiresAt });
      } else {
        res.cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "Strict",
        });
        res.cookie("token_expiry", expiresAt - 15 * 1000, {
          httpOnly: false,
          secure: true,
          sameSite: "None",
        });
        return res.json({ success: true });
      }
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
