//const userQueries = require('../knex_db_operations/userQueries');
const userQueries = require('../database/queries')
const express = require('express');
const router = express.Router();


router.get('/conversations', async (req, res) => 
    { // Dodaj async
    try {
        const conversationsData = await userQueries.GET.getUserConversations(req.userId);
        res.json({ conversations: conversationsData });
    } 
    catch (err) 
    {
        console.error("Error fetching conversations:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router