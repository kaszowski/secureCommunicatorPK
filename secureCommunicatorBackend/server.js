const express = require("express");
const fs = require("fs");
const https = require("https");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const path = require("path");
const cookieParser = require("cookie-parser");
const cookie = require("cookie");
const LRU = require("lru-cache");
const knexConfig = require("./knexfile").development;
const knex = require("knex")(knexConfig);
//const userQueries = require('./knex_db_operations/userQueries');
//const userQueries = require('./database/queries/index');
const userQueries = require("./database/queries/index");
const { blacklist } = require("./shared");
const crypto = require("crypto");
const { off } = require("process");

console.log(userQueries);

const serverOptions = {
  key: fs.readFileSync("certs/key.pem"),
  cert: fs.readFileSync("certs/cert.pem"),
};
/*const blacklist = new LRU.LRUCache({
    max: 10000,
    ttl: 1000 * 60 * 15,
  });*/

const app = express();

const SECRET_KEY = "supersecretkey";
const tokenLifeInMinutes = 15;

app.use(bodyParser.json());
app.use(cookieParser());

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

app.use(express.static("public"));

const HTTPS_PORT = 5000;

const httpsServer = https.createServer(serverOptions, app);

const io = new Server(httpsServer, {
  cors: {
    origin: [
      "http://localhost",
      "http://localhost:80",
      "https://localhost",
      "https://localhost:80",
      "http://localhost:5173", // Vite dev server
      "https://localhost:5173",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  allowEIO3: true,
  transports: ["websocket", "polling"],
});

async function getUserConversations(userId) {
  return await userQueries.GET.getUserConversations(userId);
}

function getTokenFromRequest(req) {
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
}

function verifyTokenFromRequest(req) {
  const token = getTokenFromRequest(req);
  if (!token) {
    throw new Error("Token not found");
  }

  try {
    const payload = jwt.verify(token, SECRET_KEY);
    if (blacklist.has(token)) throw new Error("Invalid or expired token");
    return payload;
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
}

function tokenMiddleware(req, res, next) {
  try {
    const payload = verifyTokenFromRequest(req);

    if (!payload) {
      return res.status(401).json({ error: "Invalid or missing token" });
    }

    req.userId = payload.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
}

io.on("connection", async (socket) => {
  const authCookies = socket.handshake.headers.cookie;

  try {
    if (!authCookies) {
      throw new Error("No cookies found");
    }

    const parsedCookies = cookie.parse(authCookies);
    const token = parsedCookies.token;

    if (!token) {
      throw new Error("No token found in cookies");
    }

    const data = jwt.verify(token, SECRET_KEY);

    if (blacklist.has(token)) {
      throw new Error("Token is blacklisted");
    }
    socket.exp = data.exp;
    socket.userId = data.userId;

    const conversationIds = await userQueries.GET.getUserConversations(
      data.userId
    );
    conversationIds.forEach((element) => {
      socket.join(element.ConversationId.toString());
    });
  } catch (err) {
    socket.emit("error", "Authentication failed: " + err.message);
    socket.disconnect(true);
    return;
  }
  socket.on("message", async (msg) => {
    try {
      const { conversationId, content } = msg;

      if (!conversationId) {
        return socket.emit("error", "no conversationId");
      }

      if (!content) {
        return socket.emit("error", "empty message");
      }

      if (!socket.rooms.has(conversationId.toString())) {
        console.error(
          `User ${socket.userId} tried to send to invalid room ${conversationId}`
        );
        return socket.emit("error", "invalid conversationId");
      }

      await userQueries.POST.addMessageToConversation(
        conversationId,
        socket.userId,
        content
      );
      socket.to(conversationId.toString()).emit("message", {
        sender: socket.userId,
        message: content,
        conversationId: conversationId,
      });
    } catch (err) {
      // Handle error silently
    }
  });
  socket.on("join", async (data) => {
    try {
      // Validate the conversationId
      if (!data || !data.conversationId) {
        return socket.emit("error", "Missing conversationId in join request");
      }

      const conversationId = data.conversationId.toString();

      // Check if the conversation exists and the user is a member
      const userConversations = await userQueries.GET.getUserConversations(
        socket.userId
      );
      const isUserInConversation = userConversations.some(
        (conv) => conv.ConversationId.toString() === conversationId
      );

      if (!isUserInConversation) {
        console.error(
          `User ${socket.userId} tried to join conversation ${conversationId} they are not a member of`
        );
        return socket.emit("error", "invalid conversationId");
      } // Join the room if not already joined
      if (!socket.rooms.has(conversationId)) {
        socket.join(conversationId);
      }

      // Acknowledge successful join
      socket.emit("joinedConversation", { conversationId });
    } catch (err) {
      socket.emit("error", "Error joining conversation: " + err.message);
    }
  });

  socket.on("disconnect", () => {
    // Handle disconnect silently
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "src/templates", "login.html"));
});

app.get("/main", (req, res) => {
  res.sendFile(path.join(__dirname, "src/templates", "index.html"));
});

const loginRoute = require("./unprotected/login");
app.use(loginRoute);

const registerRoute = require("./unprotected/register");
app.use(registerRoute);

const getPublicKey = require("./unprotected/getPublicKey");
app.use(getPublicKey);

const logoutRoutes = require("./protected/logout");
app.use(logoutRoutes);

const conversationsRoute = require("./protected/conversations");
app.use(tokenMiddleware, conversationsRoute);

const messagesRoute = require("./protected/messages");
app.use(tokenMiddleware, messagesRoute);

const keysRoutes = require("./protected/keys");
app.use(tokenMiddleware, keysRoutes);

const profileRoute = require("./protected/profile");
app.use(tokenMiddleware, profileRoute);

const updateUser = require("./protected/updateUser");
app.use(tokenMiddleware, updateUser);

const refreshTokenRoutes = require("./protected/refreshToken");
app.use(tokenMiddleware, refreshTokenRoutes);

const createConversationRoute = require("./protected/createConversation");
app.use(tokenMiddleware, createConversationRoute);

// Funkcja do sprawdzenia połączenia z bazą danych
async function checkDbConnection() {
  try {
    await knex.raw("select 1+1 as result");
    return true;
  } catch (err) {
    return false;
  }
}

// Najpierw sprawdź połączenie z DB, potem uruchom serwer
checkDbConnection()
  .then((isConnected) => {
    if (!isConnected) {
      process.exit(1); // Zakończ proces, jeśli nie można połączyć się z bazą
    }

    httpsServer.listen(HTTPS_PORT, () => {
      // Server started successfully
    }); // Create an HTTP server to redirect traffic to HTTPS
    const httpApp = express();

    httpApp.use((req, res) => {
      res.redirect(`https://${req.headers.host}${req.url}`);
    });

    const HTTP_PORT = 80; // Może wymagać uprawnień administratora
    http.createServer(httpApp).listen(HTTP_PORT, () => {
      // HTTP redirector started
    });
  })
  .catch((err) => {
    // Ten catch jest na wszelki wypadek, główna obsługa błędu jest w checkDbConnection
    process.exit(1);
  });
