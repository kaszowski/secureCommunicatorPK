//const userQueries = require('../knex_db_operations/userQueries');
const userQueries = require('../database/queries')
const express = require('express');
const router = express.Router();


router.get('/keys', async (req, res) => {
    try {
        const keys = await userQueries.GET.getUserKeys(req.userId);
        res.json({ keys: keys });
    } 
    catch (err) 
    {
        console.error("Error fetching keys", err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router