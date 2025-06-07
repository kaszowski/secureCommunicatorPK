//const userQueries = require('../knex_db_operations/userQueries');
const userQueries = require('../database/queries')
const express = require('express');
const router = express.Router();


router.get('/messages', async (req, res) => 
    {
    try {
        const {conversationId, limit, offset} = req.body
        if(!conversationId || (limit??-1)<=0 || (offset??-1)<0)
        {
            return res.status(400).json({ error: 'Missing fields' });
        }
        const conversationsData = await userQueries.GET.getUserConversations(req.userId);
        console.log(conversationsData)
        //if(!conversationsData.includes(conversationId))
        if(!conversationsData.some(obj => obj.ConversationId==conversationId))
        {
            return res.status(403).json({ error: 'User doesnt belong to conversation' });
        }
        const messages = await userQueries.GET.getMessagesInConversation(conversationId, limit, offset)
        res.json({ messages: messages });
    } 
    catch (err) 
    {
        console.error("Error fetching conversations:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router