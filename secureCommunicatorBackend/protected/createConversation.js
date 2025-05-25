const userQueries = require('../database/queries')
const express = require('express');
const router = express.Router();


router.post('/conversation/create', async (req, res) => 
    {
    const {userToAdd, keyMine, keyOther} = req.body
    try {
        const otherUser = await userQueries.GET.findUserByUsername(userToAdd)
        if(!otherUser)
        {
            return res.status(400).json("User doesnt exist")
        }
        const newConversation = await userQueries.POST.createConversation(req.userId, otherUser.UserId, keyMine, keyOther)
        //const conversationsData = await userQueries.GET.getUserConversations(req.userId);
        res.json({ newConversation: newConversation });
    } 
    catch (err) 
    {
        console.error("Error fetching conversations:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router