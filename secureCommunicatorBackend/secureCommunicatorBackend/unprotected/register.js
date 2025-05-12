const jwt = require('jsonwebtoken');
//const userQueries = require('../knex_db_operations/userQueries');
const userQueries = require('../database/queries')
const express = require('express');
const router = express.Router();


router.post('/register', async (req, res) => {
    try {
        
        const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        const { email, username, password_hash, public_key, private_key } = req.body;
    
        // Basic validation
        if (!email || !username || !password_hash || !public_key) {
          return res.status(400).json({ error: 'Missing fields' });
        }
    
        if (!EMAIL_REGEX.test(email)) {
          return res.status(400).json({ error: 'Invalid email format' });
        }
    
        if (username.length < 3 || username.length > 32) {
          return res.status(400).json({ error: 'Username must be 3-32 characters' });
        }

        /*const exists = await userQueries.checkEmailExists(email)
        if(exists) {
            return res.status(400).json({ error: 'Email already exists' });
        }*/

        //newUser = await userQueries.POST.createUser({username: username, password_hash: password_hash, email: email, public_key: public_key, private_key: private_key??null})
        newUser = await userQueries.POST.createUser(username, password_hash, email, public_key, private_key??null)
        return res.status(201).json({ message: 'Registration successful' });
    
      } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
})

module.exports = router