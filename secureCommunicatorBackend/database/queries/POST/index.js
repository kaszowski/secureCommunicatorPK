const knexConfig = require("../../../knexfile");
const env = process.env.NODE_ENV || "development";
const knex = require("knex")(knexConfig[env]);

/**
 * Uwierzytelnia użytkownika na podstawie nazwy użytkownika i hasła.
 * @param {string} username - Nazwa użytkownika.
 * @param {string} password - Hasło użytkownika.
 * @returns {Promise<number|null>} ID użytkownika (UserId) w przypadku pomyślnego uwierzytelnienia, w przeciwnym razie null.
 */
async function loginUser(username, password) {
  if (!username || !password) {
    console.error("Błąd w loginUser: Nazwa użytkownika i hasło są wymagane.");
    return null;
  }

  try {
    const user = await knex("User").where({ Username: username }).first();

    if (user) {
      const passwordMatch = password === user.PasswordHash;
      if (passwordMatch) {
        return user.UserId;
      } else {
        console.log(
          `Błąd w loginUser: Nieprawidłowe hasło dla użytkownika ${username}`
        );
        return null;
      }
    } else {
      console.log(
        `Błąd w loginUser: Użytkownik ${username} nie został znaleziony.`
      );
      return null;
    }
  } catch (error) {
    console.error("Błąd zapytania w loginUser:", error);
    return null;
  }
}

/**
 * Tworzy nowego użytkownika w bazie danych.
 * @param {string} username - Nazwa użytkownika.
 * @param {string} password - Hasło użytkownika (czysty tekst).
 * @param {string} email - Adres email użytkownika.
 * @param {string} publicKey - Klucz publiczny użytkownika.
 * @param {string} privateKey - Klucz prywatny użytkownika (zaszyfrowany).
 * @returns {Promise<object>} Obiekt nowo utworzonego użytkownika.
 */
async function createUser(username, password, email, publicKey, privateKey) {
  try {
    const passwordHash = password;
    const [newUser] = await knex("User")
      .insert({
        Username: username,
        UsernameShow: username,
        PasswordHash: passwordHash,
        Email: email,
        PublicKey: publicKey,
        PrivateKey: privateKey,
        // UpdatedAt jest generowany automatycznie przez bazę danych
      })
      .returning([
        "UserId",
        "Username",
        "UsernameShow",
        "Email",
        "PublicKey",
        "UpdatedAt",
      ]);

    return newUser;
  } catch (error) {
    console.error("Błąd podczas tworzenia użytkownika:", error);

    if (error.constraint === "User_Username_key") {
      throw new Error("Nazwa użytkownika jest już zajęta.");
    }
    if (error.constraint === "User_Email_key") {
      throw new Error("Adres email jest już używany.");
    }
    throw error;
  }
}

/**
 * Dodaje nową wiadomość do konwersacji.
 * @param {string} conversationId - ID konwersacji.
 * @param {string} userId - ID użytkownika wysyłającego wiadomość.
 * @param {string} content - Zaszyfrowana treść wiadomości jako base64 string.
 * @returns {Promise<object>} Obiekt nowo utworzonej wiadomości.
 */
async function addMessageToConversation(conversationId, userId, content) {
  try {
    return await knex.transaction(async (trx) => {
      // Sprawdzenie, czy użytkownik należy do konwersacji
      const participation = await trx("ConversationUser")
        .where({
          UserId: userId,
          ConversationId: conversationId,
        })
        .first();

      if (!participation) {
        throw new Error("Użytkownik nie należy do tej konwersacji.");
      }

      // Convert base64 encrypted content to Buffer for BYTEA storage
      const contentBuffer = Buffer.from(content, "base64");

      const [newMessage] = await trx("Message")
        .insert({
          UserId: userId,
          ConversationId: conversationId,
          Content: contentBuffer,
          // SendAt jest generowany automatycznie
        })
        .returning("*");
      return newMessage;
    });
  } catch (error) {
    console.error("Błąd podczas dodawania wiadomości do konwersacji:", error);
    throw error;
  }
}

/**
 * Tworzy nową konwersację pomiędzy dwoma użytkownikami.
 * @param {string} userId1 - ID użytkownika inicjującego konwersację.
 * @param {string} userId2 - ID drugiego użytkownika.
 * @param {string} encryptedConversationKeyUser1 - Zaszyfrowany klucz konwersacji dla użytkownika 1.
 * @param {string} encryptedConversationKeyUser2 - Zaszyfrowany klucz konwersacji dla użytkownika 2.
 * @returns {Promise<string|boolean>} ID nowej konwersacji w przypadku sukcesu, w przeciwnym razie false.
 */
async function createConversation(
  userId1,
  userId2,
  encryptedConversationKeyUser1,
  encryptedConversationKeyUser2
) {
  try {
    // Sprawdź czy konwersacja między tymi użytkownikami już istnieje
    const existingConversation = await knex("ConversationUser as cu1")
      .join(
        "ConversationUser as cu2",
        "cu1.ConversationId",
        "cu2.ConversationId"
      )
      .where("cu1.UserId", userId1)
      .where("cu2.UserId", userId2)
      .select("cu1.ConversationId")
      .first();

    if (existingConversation) {
      console.log(
        "Konwersacja między użytkownikami już istnieje:",
        existingConversation.ConversationId
      );
      return existingConversation.ConversationId;
    }

    const isBlocked1 = await knex("BlockedUser")
      .where({ UserId: userId1, BlockedUserId: userId2 })
      .first();
    const isBlocked2 = await knex("BlockedUser")
      .where({ UserId: userId2, BlockedUserId: userId1 })
      .first();

    if (isBlocked1 || isBlocked2) {
      console.log(
        "Nie można utworzyć konwersacji: jeden z użytkowników zablokował drugiego."
      );
      return false;
    }

    // Pobierz dane obu użytkowników
    const user1Details = await knex("User")
      .where({ UserId: userId1 })
      .select("UsernameShow")
      .first();
    const user2Details = await knex("User")
      .where({ UserId: userId2 })
      .select("UsernameShow")
      .first();

    if (!user1Details || !user2Details) {
      console.error(
        "Błąd w createConversation: Nie znaleziono jednego z użytkowników."
      );
      return false;
    }

    // Utworz nazwę konwersacji - używamy nazwy drugiego użytkownika (tego, z którym użytkownik chce rozmawiać)
    const conversationName = user2Details.UsernameShow;
    let newConversationId;

    await knex.transaction(async (trx) => {
      const [newConversation] = await trx("Conversation")
        .insert({
          Name: conversationName,
        })
        .returning("ConversationId");

      newConversationId = newConversation.ConversationId;

      await trx("ConversationUser").insert([
        {
          UserId: userId1,
          ConversationId: newConversationId,
          EncryptedConversationKey: encryptedConversationKeyUser1,
        },
        {
          UserId: userId2,
          ConversationId: newConversationId,
          EncryptedConversationKey: encryptedConversationKeyUser2,
        },
      ]);
    });

    return newConversationId;
  } catch (error) {
    console.error("Błąd podczas tworzenia konwersacji:", error);
    return false;
  }
}

module.exports = {
  createUser,
  addMessageToConversation,
  loginUser,
  createConversation,
};
