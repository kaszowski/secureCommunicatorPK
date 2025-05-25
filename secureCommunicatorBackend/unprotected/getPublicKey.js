const userQueries = require('../database/queries')
const express = require('express');
const router = express.Router();


router.get('/key/public', async (req, res) => {
    try {
        const {username} = req.body
        if(!username) return res.status(400).json({error: "No user id"})
        userId = (await userQueries.GET.findUserByUsername(username)).UserId
        const keys = await userQueries.GET.getUserKeys(userId);
        res.json({ keys: keys.PublicKey });
    } 
    catch (err) 
    {
        console.error("Error fetching keys:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router