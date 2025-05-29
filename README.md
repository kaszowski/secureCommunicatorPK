# 🔐 Secure Messaging API

This API provides endpoints for a secure messaging system with encrypted key exchange and authentication via HTTP-only cookies.

---

## 📋 Table of Contents

- [Authentication](#authentication)
  - [/login](#login)
  - [/register](#register)
  - [/logout](#logout)
  - [/refresh/token](#refreshtoken)
- [Key Management](#key-management)
  - [/key/public](#keypublic)
  - [/keys](#keys)
- [Conversations & Messages](#conversations--messages)
  - [/conversations](#conversations)
  - [/messages](#messages)
  - [/conversation/create](#conversationcreate)
- [Account Update](#update)
- [Real-Time Communication (Socket.io)](#real-time-communication-socketio)

---

## 🛂 Authentication

### **POST** `/login`

Authenticate a user.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
- Success or failure message.
- If successful, sets cookies:
  - `token`: Session token(HTTP-only)
  - `token_expiry`: Token expiration timestamp

---

### **POST** `/register`

Register a new user.

**Request Body:**
```json
{
  "email": "string",
  "username": "string",
  "password_hash": "string",
  "public_key": "string",
  "private_key": "string (optional, encrypted with password)"
}
```

**Response:**
- Success message or validation error

---

### **POST** `/logout`

Logs out the current user and invalidates the token.

**Headers:**  
Include credentials via `credentials: include`

---

### **POST** `/refresh/token`

Invalidates the current token and returns a new one.

**Headers:**  
Include credentials via `credentials: include`

**Response:**
- Success or failure message.
- If successful, sets cookies:
  - `token`: Session token(HTTP-only)
  - `token_expiry`: Token expiration timestamp
---

## 🔑 Key Management

### **GET** `/key/public`

Fetch a public key of another user.

**Request Body:**
```json
{
  "username": "string"
}
```

**Response:**
- Public key of the requested user

---

### **GET** `/keys`

Returns the public and private keys of the authenticated user.

**Headers:**  
Include credentials via `credentials: include`

---

## 💬 Conversations & Messages

### **GET** `/conversations`

Returns a list of all conversations of the logged-in user.

**Headers:**  
Include credentials via `credentials: include`

**Response:**
```json
{
    "conversations": [
        {
            "ConversationId": "string",
            "Name": "string",
            "Avatar": null,
            "Background": null
        }
    ]
}
```
---

### **GET** `/messages`

Fetch messages from a conversation.

**Request Body:**
```json
{
  "conversationId": "string",
  "limit": number,
  "offset": number
}
```

**Response:**
- Array of messages
```json
{
    "messages": [
        {
            "MessageId": "string",
            "UserId": "string",
            "ConversationId": "string",
            "Content": "string",
            "SendAt": "string"
        },
    ]
}
```

**Headers:**  
Include credentials via `credentials: include`

---

### **POST** `/conversation/create`

Creates a new conversation with another user.

**Request Body:**
```json
{
  "userToAdd": "string",
  "keyMine": "string",
  "keyOther": "string"
}
```

**Note:**  
May require manual addition of the column in PostgreSQL for now.

**Headers:**  
Include credentials via `credentials: include`

---

## 🔄 Update Account

### **POST** `/update`

Update account details.

**Request Body:**
```json
{
  "updates": {
    "oldPassword": "hashed string",
    "username": "string (optional)",
    "usernameShow": "string (optional)",
    "email": "string (optional)",
    "newPassword": "hashed string (optional)"
  }
}
```

**Headers:**  
Include credentials via `credentials: include`

---

## 📡 Real-Time Communication (Socket.io)

Connect using:
```js
const socket = io('https://localhost:5000', {
  secure: true,
  rejectUnauthorized: false,
  withCredentials: true,
});
```

### Receiving Messages:
```js
socket.on('message', (msg) => {
  // Handle incoming message
});
```

### Sending Messages:
```js
socket.emit('message', {
  conversationId: "string",
  content: "string"
});
```

---

## 📝 Notes

- All tokens are stored in secure, HTTP-only cookies.
- Endpoints requiring authentication must be accessed with `credentials: include`.
- Passwords must be hashed **client-side** before sending to the API.
- Key storage will use PostgreSQL `BYTEA` type