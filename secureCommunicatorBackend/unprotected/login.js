const jwt = require('jsonwebtoken');
//const userQueries = require('../knex_db_operations/userQueries');
const userQueries = require('../database/queries/index')
const express = require('express');
const {SECRET_KEY, tokenLifeInMinutes} = require('../shared')
const router = express.Router();


router.post('/login', async (req, res) => 
    { // Dodaj async
    const { username, password } = req.body;
    console.log(`Login attempt: ${username}`);
    try {
        // Użyj tabeli 'User' i kolumny 'user_id' oraz 'password_hash'
        //const user = await knex('User').where({ username: username }).first();
        console.log(username, password)
        const user = await userQueries.POST.loginUser(username, password)
        if (user) 
        {
            const token = jwt.sign(
                { userId: user},
                SECRET_KEY,
                { expiresIn: `${tokenLifeInMinutes}m` }
              );
              const isMobile = req.headers['x-client-type'] === 'mobile';
              console.log("Mobilna: ", isMobile)
              const expiresAt = Date.now() + tokenLifeInMinutes * 60 * 1000;
              if(isMobile)
              {
                return res.json({token: token, expiresAt: expiresAt})
              }
              else
              {
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'Strict'
                    });
                res.cookie("token_expiry", expiresAt-15*1000, {
                        httpOnly: false,
                        secure: true,
                        sameSite: 'None'
                    }) 
                return res.json({ success: true });
              }
        } 
        else 
        {
            console.log(`Invalid credentials for user: ${username}`);
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router