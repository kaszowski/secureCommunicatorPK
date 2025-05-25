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
//const userQueries = require('./knex_db_operations/userQueries');
//const userQueries = require('./database/queries/index');
const userQueries = require('./database/queries/index')
const {blacklist} = require("./shared")
const crypto = require('crypto');
const { off } = require('process');
  
console.log(userQueries)

const serverOptions = {
    key: fs.readFileSync('certs/key.pem'),
    cert: fs.readFileSync('certs/cert.pem')
};
/*const blacklist = new LRU.LRUCache({
    max: 10000,
    ttl: 1000 * 60 * 15,
  });*/

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
    return await userQueries.GET.getUserConversations(userId); 
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

function tokenMiddleware(req, res, next)
{
    try {
        const payload = verifyTokenFromRequest(req);

        if (!payload) {
            return res.status(401).json({ error: 'Invalid or missing token' });
        }

        req.userId = payload.userId;
        next();
    } catch (err) {
        console.error('Auth error:', err);
        res.status(401).json({ error: 'Unauthorized' });
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
    socket.on('message', async (msg) => {
        console.log('Received message:', msg);
        const { conversationId, content } = msg;
        if (!conversationId) {
            return socket.emit('error', "no conversationId")
        }

        if (!content) {
            return socket.emit('error', "empty message")
        }

        if (!!conversationsData.some(obj => obj.ConversationId==conversationId.toString())) { // Upewnij się, że ID jest stringiem
            console.error(`User ${socket.userId} tried to send to invalid room ${conversationId}`);
            return socket.emit('error', "invalid conversationId");
        }

        await userQueries.POST.addMessageToConversation(conversationId, socket.userId, content)

        socket.to(conversationId.toString()).emit('message', {
            sender: socket.userId,
            message: content,
            conversationId: conversationId
        });
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

const loginRoute = require('./unprotected/login')
app.use(loginRoute)

const registerRoute = require('./unprotected/register')
app.use(registerRoute)

const getPublicKey = require('./unprotected/getPublicKey')
app.use(getPublicKey)


const conversationsRoute = require('./protected/conversations')
app.use(tokenMiddleware, conversationsRoute)

const messagesRoute = require('./protected/messages')
app.use(tokenMiddleware, messagesRoute)

const keysRoutes = require('./protected/keys')
app.use(tokenMiddleware, keysRoutes)

const updateUser = require('./protected/updateUser')
app.use(tokenMiddleware, updateUser)

const refreshTokenRoutes = require('./protected/refreshToken')
app.use(tokenMiddleware, refreshTokenRoutes)

const logoutRoutes = require('./protected/logout')
app.use(tokenMiddleware, logoutRoutes)

const createConversationRoute = require('./protected/createConversation')
app.use(tokenMiddleware, createConversationRoute)

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
