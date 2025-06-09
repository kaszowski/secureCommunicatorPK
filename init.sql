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



-- Wstawienie nowych rekordów użytkowników
INSERT INTO "User" ("UserId", "Username", "UsernameShow", "PasswordHash", "Email", "UpdatedAt", "PublicKey", "PrivateKey")
VALUES
  (gen_random_uuid(), 'bobmarley', 'Bob Marley', 'password_hash1', 'bobmarley@example.com', '2025-04-30T10:00:00Z', 'fake_public_key_1', 'fake_private_key_1'),
  (gen_random_uuid(), 'alicejenson', 'Alice Jenson', 'password_hash2', 'alicejenson@example.com', '2025-04-30T11:00:00Z', 'fake_public_key_2', 'fake_private_key_2');

DELETE FROM "UserLogins";

DO $$
DECLARE
    bob_marley_id UUID;
    alice_jenson_id UUID;
BEGIN
    -- Pobierz ID użytkowników
    SELECT "UserId" INTO bob_marley_id FROM "User" WHERE "Username" = 'bobmarley';
    SELECT "UserId" INTO alice_jenson_id FROM "User" WHERE "Username" = 'alicejenson';

    -- Sprawdź czy użytkownicy istnieją
    IF bob_marley_id IS NULL OR alice_jenson_id IS NULL THEN
        RAISE EXCEPTION 'Nie znaleziono użytkowników bobmarley lub alicejenson';
    END IF;

    -- Wstaw dane logowania
    INSERT INTO "UserLogins" ("UserId", "LoginTimestamp", "IpAddress", "Success")
    VALUES
        -- Logowania dla bobmarley
        (bob_marley_id, '2025-04-30T10:10:00Z', '192.168.1.10', true),
        (bob_marley_id, '2025-04-30T12:15:30Z', '192.168.1.10', true),
        (bob_marley_id, '2025-04-30T14:05:00Z', '10.0.0.5', false),
        -- Logowania dla alicejenson
        (alice_jenson_id, '2025-04-30T11:50:00Z', '108.10.13.9', false),
        (alice_jenson_id, '2025-04-30T13:30:15Z', '203.0.113.25', true),
        (alice_jenson_id, '2025-04-30T15:45:00Z', '203.0.113.25', true);
END $$;

-- Czyszczenie istniejących danych w odpowiedniej kolejności (ze względu na klucze obce)
DELETE FROM "Message";
DELETE FROM "ConversationUser";
DELETE FROM "Conversation";

-- Tworzenie konwersacji i dodawanie wiadomości
DO $$
DECLARE
    bob_marley_id UUID;
    alice_jenson_id UUID;
    conversation_id UUID;
    encrypted_conv_key_for_bob BYTEA := '\xDEADBEEF0102030405060708090A0B0C0D0E0F'; -- Przykładowa wartość hex
    encrypted_conv_key_for_alice BYTEA := '\xCAFEBABEFEEDBEEF00112233445566778899AABB'; -- Przykładowa wartość hex
BEGIN
    -- Pobierz ID użytkowników
    SELECT "UserId" INTO bob_marley_id FROM "User" WHERE "Username" = 'bobmarley';
    SELECT "UserId" INTO alice_jenson_id FROM "User" WHERE "Username" = 'alicejenson';

    -- Sprawdź czy użytkownicy istnieją
    IF bob_marley_id IS NULL OR alice_jenson_id IS NULL THEN
        RAISE EXCEPTION 'Nie znaleziono użytkowników bobmarley lub alicejenson';
    END IF;

    -- 1. Utwórz nową konwersację
    conversation_id := gen_random_uuid();
    INSERT INTO "Conversation" ("ConversationId", "Name")
    VALUES (conversation_id, 'Bob & Alice Chat');

    -- 2. Dodaj użytkowników do konwersacji
    INSERT INTO "ConversationUser" ("UserId", "ConversationId", "EncryptedConversationKey", "Attributes")
    VALUES
        (bob_marley_id, conversation_id, encrypted_conv_key_for_bob, NULL),
        (alice_jenson_id, conversation_id, encrypted_conv_key_for_alice, NULL);

    -- 3. Dodaj wiadomości do konwersacji
    INSERT INTO "Message" ("MessageId", "UserId", "ConversationId", "Content", "SendAt")
    VALUES
        (gen_random_uuid(), bob_marley_id, conversation_id, decode('SGV5IEFsaWNlIQ==', 'base64'), '2025-04-30T16:00:00Z'),
        (gen_random_uuid(), alice_jenson_id, conversation_id, decode('SGkgQm9iISBIb3cgYXJlIHlvdT8=', 'base64'), '2025-04-30T16:01:00Z'),
        (gen_random_uuid(), bob_marley_id, conversation_id, decode('RG9pbmcgZ3JlYXQsIHRoYW5rcyEgSnVzdCB0ZXN0aW5nIHRoaXMgY2hhdC4=', 'base64'), '2025-04-30T16:02:00Z'),
        (gen_random_uuid(), alice_jenson_id, conversation_id, decode('TG9va3MgbGlrZSBpdCB3b3JrcyE=', 'base64'), '2025-04-30T16:03:00Z');
END $$;