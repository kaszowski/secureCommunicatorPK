const express = require("express");
const { blacklist } = require("../shared");
const router = express.Router();

function getTokenFromRequest(req) {
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
}

router.post("/logout", (req, res) => {
  try {
    //const oldToken = req.cookies.token
    const oldToken = getTokenFromRequest(req);
    if (oldToken) {
      blacklist.set(oldToken, true);
      res.clearCookie("token");
      res.clearCookie("token_expiry");
    }
    res.json({ success: true });
  } catch (err) {
    res.json({ success: true });
  }
});

module.exports = router;
