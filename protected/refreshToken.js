const {SECRET_KEY, tokenLifeInMinutes, blacklist} = require('../shared')
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();

function getTokenFromRequest(req)
{
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }

    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }
    return null
}

router.get('/refresh/token', (req, res) => {
    try {
        const newToken = jwt.sign(
            { userId: req.userId},
            SECRET_KEY,
            { expiresIn: `${tokenLifeInMinutes}m` }
        );
        res.cookie('token', newToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict'
        });
        const expiresAt = Date.now() + tokenLifeInMinutes * 60 * 1000;
        res.cookie("token_expiry", expiresAt-15*1000, {
            httpOnly: false,
            secure: true,
            sameSite: 'None'
        })
        blacklist.set(getTokenFromRequest(req), true)
        //return res.json({ success: true });
        return res.json({token: newToken, expiresAt: expiresAt})
    } catch (err) {
        console.log(err)
        res.status(401).json({ error: 'Invalid or expired token' });
    }
});

module.exports = router