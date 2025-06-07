//const userQueries = require('../knex_db_operations/userQueries');
const userQueries = require('../database/queries')
const express = require('express');
const router = express.Router();


router.post('/update', async (req, res) => {
    try {
        const {updates} = req.body
        if(!updates) res.status(400).json({ error: 'Empty' });
       const changed = await userQueries.UPDATE.updateUser(req.userId, updates)
        res.json({ success: changed});
    } 
    catch (err) 
    {
        console.error("Error fetching conversations:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
})

module.exports = router