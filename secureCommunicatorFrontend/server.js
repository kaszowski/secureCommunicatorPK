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


const serverOptions = {
    key: fs.readFileSync('certs/key.pem'),
    cert: fs.readFileSync('certs/cert.pem')
};

const blacklist = new LRU.LRUCache({
    max: 10000,
    ttl: 1000 * 60 * 15, //<-ile milisekund do usunięcia
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

const USER = {
    username: 'john',
    password: 'hunter2', // in real life this should be hashed
    id: 1,
    role: 'admin'
};

const conversations = [
    [{id: 0, user1: 0, user2: 1}],
    [{id: 0, user1: 1, user2: 0}]
]

function getUserConversations(userId)
{
    return conversations[userId]
}

// Create HTTPS server
const httpsServer = https.createServer(serverOptions, app);

const io = new Server(httpsServer, {
    cors: {
      origin: 'https://localhost:3000',   // frontend origin
      methods: ['GET', 'POST'],
      credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('A client connected via HTTPS');
    const authCookies = socket.handshake.headers.cookie
    try
    {
        token = cookie.parse(authCookies).token
        data = jwt.verify(token, SECRET_KEY)
        if(blacklist.has(token))
        {
            socket.emit("error", "Invalid token");
            socket.disconnect(true)
        }
        socket.exp = data.exp
        socket.id = data.userId
        conversationIds = getUserConversations(data.userId)
        conversationIds.forEach(element => {
            socket.join(element.id)
        });
        console.log(socket.rooms)
    }
    catch(err)
    {
        socket.emit("error", "Invalid token");
        socket.disconnect(true)
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

        if (!socket.rooms.has(parseInt(conversationId))) {
            return socket.emit('error', "invalid conversationId");
        }
        socket.to(conversationId).emit('message', {
            sender: socket.id,
            message: content,
        });
        //socket.broadcast.emit('message', msg);
    });
  });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/templates', 'login.html'));
});

app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/templates', 'index.html'));
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log(username, password)
    if (username === USER.username && password === USER.password) {
      const token = jwt.sign(
        { userId: USER.id, username: USER.username},
        SECRET_KEY,
        { expiresIn: `${tokenLifeInMinutes}m` }
      );
      res.cookie('token', token, {
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
      return res.json({ success: true });
    }
    res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/conversations', (req, res) => {
    try {
        token = req.cookies.token
        const payload = jwt.verify(token, SECRET_KEY);
        res.json({conversations: getUserConversations(payload.userId)})
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
});

app.get('/refresh/token', (req, res) => {
    try {
        const oldToken = req.cookies.token
        if(blacklist.has(oldToken)) return res.status(401).json({ error: 'Invalid or expired token' });
        const payload = jwt.verify(oldToken, SECRET_KEY);
        const newToken = jwt.sign(
            { userId: payload.userId, username: payload.username},
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
        return res.json({ success: true });
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
});

app.get('/logout', (req, res) => {
    try {
        const oldToken = req.cookies.token
        const payload = jwt.verify(oldToken, SECRET_KEY);
        blacklist.set(oldToken, true)
        res.json({success: true})
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
})

// Start HTTPS Server
const HTTPS_PORT = 3000;
httpsServer.listen(HTTPS_PORT, () => {
    console.log(`Secure WebSocket server running on https://localhost:${HTTPS_PORT}`);
});

// Create an HTTP server to redirect traffic to HTTPS
const httpApp = express();

httpApp.use((req, res) => {
    res.redirect(`https://${req.headers.host}${req.url}`);
});

const HTTP_PORT = 80; // You need root/admin privileges for port 80
http.createServer(httpApp).listen(HTTP_PORT, () => {
    console.log(`HTTP redirector running on http://localhost:${HTTP_PORT}`);
});
