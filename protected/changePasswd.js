//const userQueries = require('../knex_db_operations/userQueries');
const userQueries = require('../database/queries')
const express = require('express');
const router = express.Router();


router.post('/passwd/change', async (req, res) => {
    try {
        const {currentPassword, newPassword} = req.body
        if(!currentPassword || !newPassword)
        {
            return res.status(400).json({ error: 'Missing fields' });
        }
        const changed = await userQueries.UPDATE.changePassword(req.userId, currentPassword, newPassword, req.newPrivateKey??null)
        res.json({ success: changed});
    } 
    catch (err) 
    {
        console.error("Error fetching conversations:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
})

module.exports = router