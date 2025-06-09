// Helper script to generate RSA keys for seed data
const crypto = require("crypto");

// Generate RSA key pair for a user
function generateUserKeys() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  return { publicKey, privateKey };
}

// Generate conversation key (32 bytes for AES-256)
function generateConversationKey() {
  return crypto.randomBytes(32).toString("base64");
}

// Encrypt conversation key with RSA public key
function encryptConversationKey(conversationKey, publicKey) {
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(conversationKey, "base64")
  );
  return encrypted.toString("base64");
}

// Generate test data
const bobKeys = generateUserKeys();
const aliceKeys = generateUserKeys();
const conversationKey = generateConversationKey();

const encryptedKeyForBob = encryptConversationKey(
  conversationKey,
  bobKeys.publicKey
);
const encryptedKeyForAlice = encryptConversationKey(
  conversationKey,
  aliceKeys.publicKey
);

console.log("=== BOB MARLEY KEYS ===");
console.log("Public Key:");
console.log(bobKeys.publicKey);
console.log("Private Key:");
console.log(bobKeys.privateKey);
console.log("Encrypted Conversation Key:");
console.log(encryptedKeyForBob);

console.log("\n=== ALICE JENSON KEYS ===");
console.log("Public Key:");
console.log(aliceKeys.publicKey);
console.log("Private Key:");
console.log(aliceKeys.privateKey);
console.log("Encrypted Conversation Key:");
console.log(encryptedKeyForAlice);

console.log("\n=== CONVERSATION KEY ===");
console.log("Original Key:", conversationKey);
