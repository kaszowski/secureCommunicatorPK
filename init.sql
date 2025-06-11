-- Usuń istniejące tabele, jeśli istnieją i pamiętaj o kolejności
DROP TABLE IF EXISTS "Message" CASCADE;
DROP TABLE IF EXISTS "ConversationUser" CASCADE;
DROP TABLE IF EXISTS "Conversation" CASCADE;
DROP TABLE IF EXISTS "BlockedUser" CASCADE;
DROP TABLE IF EXISTS "UserLogins" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "knex_migrations" CASCADE;
DROP TABLE IF EXISTS "knex_migrations_lock" CASCADE;

-- Tabela Użytkowników
CREATE TABLE "User" (
    "UserId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Username" VARCHAR(255) NOT NULL UNIQUE,
    "UsernameShow" VARCHAR(255) NOT NULL,
    "PasswordHash" VARCHAR(255) NOT NULL,
    "Email" VARCHAR(255) NOT NULL UNIQUE,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "PublicKey" VARCHAR NOT NULL,
    "PrivateKey" VARCHAR NULL
);

-- Tabela zablokowanych użytkowników
CREATE TABLE "BlockedUser" (
    "BlockId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId" UUID NOT NULL,
    "BlockedUserId" UUID NOT NULL,
    "Timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("UserId") REFERENCES "User"("UserId") ON DELETE CASCADE,
    FOREIGN KEY ("BlockedUserId") REFERENCES "User"("UserId") ON DELETE CASCADE
);

-- Tabela Konwersacji
CREATE TABLE "Conversation" (
    "ConversationId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name" VARCHAR(255),
    "Avatar" BYTEA,
    "Background" BYTEA,
    "Status" SMALLINT DEFAULT 0,
    "StatusTimestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK ("Status" IN (0, 1)) -- 0: Aktywna, 1: Archiwizowana
);

-- Tabela Pośrednia Użytkownik-Konwersacja
CREATE TABLE "ConversationUser" (
    "UserId" UUID NOT NULL,
    "ConversationId" UUID NOT NULL,
    "EncryptedConversationKey" TEXT NOT NULL,
    "Attributes" SMALLINT,
    PRIMARY KEY ("UserId", "ConversationId"),
    FOREIGN KEY ("UserId") REFERENCES "User"("UserId") ON DELETE CASCADE,
    FOREIGN KEY ("ConversationId") REFERENCES "Conversation"("ConversationId") ON DELETE CASCADE
);

-- Tabela Wiadomości
CREATE TABLE "Message" (
    "MessageId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId" UUID NULL, -- Zmieniono z NOT NULL na NULL, aby umożliwić SET NULL
    "ConversationId" UUID NOT NULL,
    "Content" BYTEA NOT NULL, -- Zaszyfrowana treść w BYTEA
    "SendAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("UserId") REFERENCES "User"("UserId") ON DELETE SET NULL, -- Zmieniono z ON DELETE CASCADE
    FOREIGN KEY ("ConversationId") REFERENCES "Conversation"("ConversationId") ON DELETE CASCADE
);

-- Tabela historii logowań
CREATE TABLE "UserLogins" (
    "UserLoginId" SERIAL PRIMARY KEY,
    "UserId" UUID NOT NULL,
    "LoginTimestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "IpAddress" VARCHAR(45),
    "Success" BOOLEAN NOT NULL,
    FOREIGN KEY ("UserId") REFERENCES "User"("UserId") ON DELETE CASCADE
);


-- Indeksy

-- Tabela User
CREATE INDEX IF NOT EXISTS idx_user_publickey ON "User" ("PublicKey");

-- Indeksy dla tabeli BlockedUser
CREATE INDEX IF NOT EXISTS idx_blockeduser_userid ON "BlockedUser" ("UserId");
CREATE INDEX IF NOT EXISTS idx_blockeduser_blockeduserid ON "BlockedUser" ("BlockedUserId");
CREATE INDEX IF NOT EXISTS idx_blockeduser_timestamp ON "BlockedUser" ("Timestamp");

-- Tabela Conversation
CREATE INDEX IF NOT EXISTS idx_conversation_name ON "Conversation" ("Name");
CREATE INDEX IF NOT EXISTS idx_conversation_status ON "Conversation" ("Status");

-- Tabela ConversationUser
CREATE INDEX IF NOT EXISTS idx_conversationuser_userid ON "ConversationUser" ("UserId");
CREATE INDEX IF NOT EXISTS idx_conversationuser_conversationid ON "ConversationUser" ("ConversationId");

-- Tabela Message
CREATE INDEX IF NOT EXISTS idx_message_userid ON "Message" ("UserId");
CREATE INDEX IF NOT EXISTS idx_message_conversationid ON "Message" ("ConversationId");
CREATE INDEX IF NOT EXISTS idx_message_conversation_sendat ON "Message" ("ConversationId", "SendAt" DESC);

-- Tabela UserLogins
CREATE INDEX IF NOT EXISTS idx_userlogins_userid ON "UserLogins" ("UserId");
CREATE INDEX IF NOT EXISTS idx_userlogins_userid_logintimestamp ON "UserLogins" ("UserId", "LoginTimestamp" DESC);