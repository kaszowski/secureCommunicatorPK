const express = require('express');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const cookie = require('cookie');
const LRU = require('lru-cache');
const knexConfig = require('./knexfile').development;
const knex = require('knex')(knexConfig);
const userQueries = require('./knex_db_operations/userQueries');
const { off } = require('process');

async function main() {

    val = await userQueries.loginUser("bobmarley", "password_hash1")
    console.log(val)
    conv = await userQueries.getUserConversations(val)
    console.log("Conversations: ", conv)
    console.log("Keys: ", await userQueries.getUserKeys(val))
    console.log("Mail check: ", await userQueries.checkEmailExists("bobmarley@example.com"))
    console.log("By login: ", await userQueries.findUserByUsername("abc"))
    console.log("Conversation #1: ", await userQueries.getMessagesInConversation(conv[0], 10, 0))
    newUser = await userQueries.registerUser({username:"abc", password_hash:"123", email:"abc@gmail.com", public_key: "pub_key_abc"})
    console.log("New user: ", newUser)
    console.log("Check: ", await userQueries.loginUser("abc", "123"))
    console.log("Change password", await userQueries.changePassword(newUser, "123", "abcde"))
    console.log("Check 2: ", await userQueries.loginUser("abc", "abcde"))
    console.log("Check 3: ", await userQueries.loginUser("abc", "abcde1"))
}
//main();
  

const serverOptions = {
    key: fs.readFileSync('certs/key.pem'),
    cert: fs.readFileSync('certs/cert.pem')
};
const blacklist = new LRU.LRUCache({
    max: 10000,
    ttl: 1000 * 60 * 15,
  });

const app = express();

const SECRET_KEY = 'supersecretkey';
const tokenLifeInMinutes = 15;

app.use(bodyParser.json());
app.use(cookieParser())

app.use((req, res, next) => {
    if (!req.secure) {
        return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
});

app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "frame-ancestors 'none'");
    next();
  });
  

app.use(express.static('public'));

const HTTPS_PORT = 5000;

const httpsServer = https.createServer(serverOptions, app);

const io = new Server(httpsServer, {
    cors: {
      origin: `https://localhost:${HTTPS_PORT}`,
      methods: ['GET', 'POST'],
      credentials: true
    }
});

async function getUserConversations(userId)
{
    return await userQueries.getUserConversations(userId); 
}

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

function verifyTokenFromRequest(req) {
    const token = getTokenFromRequest(req);
    if (!token) {
      throw new Error('Token not found');
    }
  
    try {
      const payload = jwt.verify(token, SECRET_KEY);
      if(blacklist.has(token)) throw new Error('Invalid or expired token');
      return payload;
    } catch (err) {
      throw new Error('Invalid or expired token');
    }
}

io.on('connection', async (socket) => {
    console.log('A client connected via HTTPS');
    const authCookies = socket.handshake.headers.cookie
    try
    {
        token = cookie.parse(authCookies).token
        data = jwt.verify(token, SECRET_KEY)
        if(blacklist.has(token))
        {
            socket.emit("error", "Invalid token");
            socket.disconnect(true);
            return;
        }
        socket.exp = data.exp
        socket.userId = data.userId
        const conversationIds = await getUserConversations(data.userId);
        conversationIds.forEach(element => {
            socket.join(element.id.toString()); // Upewnij się, że ID jest stringiem
        });
        console.log(`User ${socket.userId} connected. Rooms:`, socket.rooms);
    }
    catch(err)
    {
        console.error("Auth error:", err.message);
        socket.emit("error", "Invalid token");
        socket.disconnect(true);
    }
    socket.on('message', (msg) => {
        console.log('Received message:', msg);
        const { conversationId, content } = msg;
        if (!conversationId) {
            return socket.emit('error', "no conversationId")
        }

        if (!content) {
            return socket.emit('error', "empty message")
        }

        // Sprawdź, czy użytkownik jest w konwersacji
        if (!socket.rooms.has(conversationId.toString())) { // Upewnij się, że ID jest stringiem
            console.error(`User ${socket.userId} tried to send to invalid room ${conversationId}`);
            return socket.emit('error', "invalid conversationId");
        }
        // TODO: Zapisz wiadomość w bazie danych

        // Wyślij wiadomość do innych w konwersacji
        socket.to(conversationId.toString()).emit('message', {
            sender: socket.userId, // Użyj userId
            message: content,
            conversationId: conversationId // Dodaj ID konwersacji do wiadomości
        });
        //socket.broadcast.emit('message', msg);
    });

    socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
    });
  });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/templates', 'login.html'));
});

app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/templates', 'index.html'));
});

// Zaktualizowana trasa logowania używająca Knex
app.post('/login', async (req, res) => 
    { // Dodaj async
    const { username, password } = req.body;
    console.log(`Login attempt: ${username}`);
    try {
        // Użyj tabeli 'User' i kolumny 'user_id' oraz 'password_hash'
        //const user = await knex('User').where({ username: username }).first();
        const user = await userQueries.loginUser(username, password)
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

app.get('/conversations', async (req, res) => 
    { // Dodaj async
    try {
        const payload = verifyTokenFromRequest(req)
        const conversationsData = await getUserConversations(payload.userId);
        res.json({ conversations: conversationsData });
    } 
    catch (err) 
    {
        if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) 
            {
            res.status(401).json({ error: 'Invalid or expired token' });
        } else {
            console.error("Error fetching conversations:", err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

app.get('/messages', async (req, res) => 
    { // Dodaj async
    try {
        const {conversationId, limit, offset} = req.body
        if(!conversationId || (limit??-1)<=0 || (offset??-1)<0)
        {
            return res.status(400).json({ error: 'Missing fields' });
        }
        const payload = verifyTokenFromRequest(req)
        const conversationsData = await getUserConversations(payload.userId);
        console.log(conversationsData)
        if(!conversationsData.includes(conversationId))
        {
            return res.status(403).json({ error: 'User doesnt belong to conversation' });
        }
        const messages = await userQueries.getMessagesInConversation(conversationId, limit, offset)
        res.json({ messages: messages });
    } 
    catch (err) 
    {
        if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) 
            {
            res.status(401).json({ error: 'Invalid or expired token' });
        } else {
            console.error("Error fetching conversations:", err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

app.get('/refresh/token', (req, res) => {
    try {
        //const oldToken = req.cookies.token
        //if(blacklist.has(oldToken)) return res.status(401).json({ error: 'Invalid or expired token' });
        //const payload = jwt.verify(oldToken, SECRET_KEY);
        payload = verifyTokenFromRequest(req)
        const newToken = jwt.sign(
            { userId: payload.userId},
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
        blacklist.set(oldToken, true)
        //return res.json({ success: true });
        return res.json({token: token, expiresAt: expiresAt})
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
});

app.get('/keys', async (req, res) => {
    try {
        const payload = verifyTokenFromRequest(req)
        const keys = await userQueries.getUserKeys(payload.userId);
        res.json({ keys: keys });
    } 
    catch (err) 
    {
        if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) 
            {
            res.status(401).json({ error: 'Invalid or expired token' });
        } else {
            console.error("Error fetching conversations:", err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

app.post('/passwd/change', async (req, res) => {
    try {
        const {currentPassword, newPassword} = req.body
        if(!currentPassword || !newPassword)
        {
            return res.status(400).json({ error: 'Missing fields' });
        }
        const payload = verifyTokenFromRequest(req)
        const chaneged = await userQueries.changePassword(payload.userId, currentPassword, newPassword)
        //const keys = await userQueries.getUserKeys(payload.userId);
        res.json({ success: chaneged});
    } 
    catch (err) 
    {
        if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) 
            {
            res.status(401).json({ error: 'Invalid or expired token' });
        } else {
            console.error("Error fetching conversations:", err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
})

app.post('/register', async (req, res) => {
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

        const exists = await userQueries.checkEmailExists(email)
        if(exists) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        newUser = await userQueries.registerUser({username: username, password_hash: password_hash, email: email, public_key: public_key, private_key: private_key??null})
        return res.status(201).json({ message: 'Registration successful' });
    
      } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
})

app.post('/logout', (req, res) => {
    try {
        const oldToken = req.cookies.token
        // Sprawdź, czy token istnieje przed dodaniem do blacklisty
        if (oldToken) {
            // Nie ma potrzeby weryfikować tokenu przy wylogowaniu, wystarczy go unieważnić
            blacklist.set(oldToken, true);
            res.clearCookie('token');
            res.clearCookie('token_expiry');
        }
        res.json({success: true})
    } catch (err) {
        // Błąd może wystąpić tylko jeśli jest problem z odczytem ciasteczka,
        // ale samo dodanie do blacklisty nie powinno rzucać błędu JWT.
        console.error("Logout error:", err);
        // Zwróć sukces nawet jeśli token był już nieważny lub nie istniał
        res.json({success: true});
    }
})

// Funkcja do sprawdzenia połączenia z bazą danych
async function checkDbConnection() 
{
    try 
    {
        await knex.raw('select 1+1 as result');
        console.log('Database connection successful.');
        return true;
    } 
    catch (err) 
    {
        console.error('Database connection failed:', err);
        return false;
    }
}

// Najpierw sprawdź połączenie z DB, potem uruchom serwer
checkDbConnection().then(isConnected => 
    {
    if (!isConnected) 
        {
        console.error("Exiting due to database connection failure.");
        process.exit(1); // Zakończ proces, jeśli nie można połączyć się z bazą
    }

    httpsServer.listen(HTTPS_PORT, () => 
        {
        console.log(`Secure WebSocket server running on https://localhost:${HTTPS_PORT}`);
    });

    // Create an HTTP server to redirect traffic to HTTPS
    const httpApp = express();

    httpApp.use((req, res) => {
        res.redirect(`https://${req.headers.host}${req.url}`);
    });

    const HTTP_PORT = 80; // Może wymagać uprawnień administratora
    http.createServer(httpApp).listen(HTTP_PORT, () => {
        console.log(`HTTP redirector running on http://localhost:${HTTP_PORT}`);
    });

}).catch(err => {
    // Ten catch jest na wszelki wypadek, główna obsługa błędu jest w checkDbConnection
    console.error("Failed to initialize server:", err);
    process.exit(1);
});
