const jwt = require("jsonwebtoken");
//const userQueries = require('../knex_db_operations/userQueries');
const userQueries = require("../database/queries");
const express = require("express");
const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    const { email, username, password_hash, public_key, private_key } =
      req.body;

    // Basic validation
    if (!email || !username || !password_hash || !public_key) {
      return res.status(400).json({ error: "Missing fields" });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (username.length < 3 || username.length > 32) {
      return res
        .status(400)
        .json({ error: "Username must be 3-32 characters" });
    }

    // Validate that password_hash is actually hashed (should be hex string of expected length)
    if (!password_hash || typeof password_hash !== "string") {
      return res.status(400).json({ error: "Invalid password hash format" });
    }

    // SHA-256 hash should be 64 characters long (hex)
    if (!/^[a-f0-9]{64}$/i.test(password_hash)) {
      return res
        .status(400)
        .json({ error: "Password must be properly hashed on client-side" });
    }

    // Validate public key format
    if (
      !public_key ||
      typeof public_key !== "string" ||
      public_key.length < 10
    ) {
      return res.status(400).json({ error: "Invalid public key format" });
    }

    const emailExists = await userQueries.GET.checkEmailExists(email);
    if (emailExists) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const loginExists = await userQueries.GET.findUserByUsername(username);
    if (loginExists) {
      return res.status(400).json({ error: "Login already exists" });
    }
    //newUser = await userQueries.POST.createUser({username: username, password_hash: password_hash, email: email, public_key: public_key, private_key: private_key??null})
    newUser = await userQueries.POST.createUser(
      username,
      password_hash,
      email,
      public_key,
      private_key ?? null
    );
    return res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
