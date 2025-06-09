const knexConfig = require("../../../knexfile").development;
const knex = require("knex")(knexConfig);

/**
 * Znajduje użytkownika po nazwie użytkownika.
 * @param {string} username - Nazwa użytkownika.
 * @returns {Promise<object|null>} Obiekt użytkownika lub null, jeśli nie znaleziono.
 */
async function findUserByUsername(username) {
  try {
    const user = await knex("User").where({ Username: username }).first();
    return user;
  } catch (error) {
    console.error("Błąd podczas wyszukiwania użytkownika po nazwie:", error);
    throw error;
  }
}

/**
 * Pobiera klucze publiczny i prywatny użytkownika.
 * @param {string} userId - ID użytkownika.
 * @returns {Promise<object|null>} Obiekt z kluczami lub null.
 */
async function getUserKeys(userId) {
  try {
    const keys = await knex("User")
      .select("PublicKey", "PrivateKey")
      .where({ UserId: userId })
      .first();
    return keys;
  } catch (error) {
    console.error("Błąd podczas pobierania kluczy użytkownika:", error);
    throw error;
  }
}

/**
 * Sprawdza, czy użytkownik o podanym ID istnieje.
 * @param {string} userId - ID użytkownika.
 * @returns {Promise<boolean>} True, jeśli użytkownik istnieje, false w przeciwnym razie.
 */
async function checkUserExists(userId) {
  try {
    const result = await knex("User")
      .where({ UserId: userId })
      .first(knex.raw("1"));
    return !!result;
  } catch (error) {
    console.error("Błąd podczas sprawdzania istnienia użytkownika:", error);
    throw error;
  }
}

/**
 * Sprawdza, czy użytkownik o podanym emailu istnieje.
 * @param {string} email - Email użytkownika.
 * @returns {Promise<boolean>} True, jeśli użytkownik z tym emailem istnieje, false w przeciwnym razie.
 */
async function checkEmailExists(email) {
  try {
    const result = await knex("User")
      .where({ Email: email })
      .first(knex.raw("1"));
    return !!result;
  } catch (error) {
    console.error("Błąd podczas sprawdzania istnienia emaila:", error);
    throw error;
  }
}

/**
 * Pobiera dane użytkownika po ID, z wyłączeniem niektórych pól.
 * @param {string} userId - ID użytkownika.
 * @returns {Promise<object|null>} Obiekt użytkownika lub null.
 */
async function getUserById(userId) {
  try {
    const user = await knex("User")
      .select("UserId", "Username", "Email", "UpdatedAt", "PublicKey") // Wybierz tylko potrzebne pola
      .where({ UserId: userId })
      .first();
    return user;
  } catch (error) {
    console.error("Błąd podczas pobierania użytkownika po ID:", error);
    throw error;
  }
}

/**
 * Pobiera wszystkie konwersacje dla danego użytkownika.
 * @param {string} userId - ID użytkownika.
 * @returns {Promise<Array<object>>} Lista konwersacji.
 */
/**
 * Pobiera wszystkie konwersacje dla danego użytkownika.
 * @param {string} userId - ID użytkownika.
 * @returns {Promise<Array<object>>} Lista konwersacji.
 */
async function getUserConversations(userId) {
  try {
    const conversations = await knex("ConversationUser")
      .join(
        "Conversation",
        "ConversationUser.ConversationId",
        "Conversation.ConversationId"
      )
      .where("ConversationUser.UserId", userId)
      .select(
        "Conversation.ConversationId",
        "Conversation.Name",
        "Conversation.Avatar",
        "Conversation.Background",
        "ConversationUser.EncryptedConversationKey"
      );

    // For each conversation, find the other participant and use their name as display name
    const enrichedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        try {
          // Find other participants in this conversation
          const otherParticipants = await knex("ConversationUser")
            .join("User", "ConversationUser.UserId", "User.UserId")
            .where(
              "ConversationUser.ConversationId",
              conversation.ConversationId
            )
            .where("ConversationUser.UserId", "!=", userId)
            .select("User.UsernameShow", "User.UserId")
            .limit(1); // For 1-on-1 conversations

          if (otherParticipants.length > 0) {
            // Use the other participant's name as the display name
            return {
              ...conversation,
              Name: otherParticipants[0].UsernameShow,
              OtherUserId: otherParticipants[0].UserId,
            };
          } else {
            // Fallback to original name if no other participant found
            return conversation;
          }
        } catch (error) {
          console.error("Error enriching conversation:", error);
          return conversation;
        }
      })
    );

    return enrichedConversations;
  } catch (error) {
    console.error("Błąd podczas pobierania konwersacji użytkownika:", error);
    throw error;
  }
}

/**
 * Pobiera wiadomości dla danej konwersacji z opcjonalnym ograniczeniem i offsetem.
 * @param {string} conversationId - ID konwersacji.
 * @param {number} limit - Maksymalna liczba wiadomości do pobrania.
 * @param {number} offset - Liczba wiadomości do pominięcia.
 * @returns {Promise<Array<object>>} Lista wiadomości z zawartością jako base64.
 */
async function getMessagesInConversation(
  conversationId,
  limit = null,
  offset = 0
) {
  try {
    let query = knex("Message")
      .where({ ConversationId: conversationId })
      .orderBy("SendAt", "asc") // Changed from 'desc' to 'asc' for chronological order
      .select("*");

    if (offset > 0) {
      query = query.offset(offset);
    }

    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    const messages = await query;

    // Convert BYTEA content to base64 strings for transmission
    const processedMessages = messages.map((message) => ({
      ...message,
      Content: message.Content
        ? Buffer.from(message.Content).toString("base64")
        : "",
    }));

    return processedMessages;
  } catch (error) {
    console.error("Błąd podczas pobierania wiadomości dla konwersacji:", error);
    throw error;
  }
}

/**
 * Pobiera dane konwersacji po ID.
 * @param {string} conversationId - ID konwersacji.
 * @returns {Promise<object|null>} Obiekt konwersacji lub null.
 */
async function getConversationById(conversationId) {
  try {
    const conversation = await knex("Conversation")
      .where({ ConversationId: conversationId })
      .first();

    if (!conversation) {
      return null;
    }

    // Get the encrypted conversation key for all participants
    const conversationUsers = await knex("ConversationUser")
      .where({ ConversationId: conversationId })
      .select("UserId", "EncryptedConversationKey");

    // Include the encrypted key in the response
    return {
      ...conversation,
      Users: conversationUsers,
    };
  } catch (error) {
    console.error("Błąd podczas pobierania konwersacji po ID:", error);
    throw error;
  }
}

/**
 * Sprawdza, czy konwersacja między dwoma użytkownikami już istnieje.
 * @param {string} userId1 - ID pierwszego użytkownika.
 * @param {string} userId2 - ID drugiego użytkownika.
 * @returns {Promise<object|null>} Obiekt konwersacji jeśli istnieje, null w przeciwnym razie.
 */
async function findConversationBetweenUsers(userId1, userId2) {
  try {
    // Znajdź wszystkie konwersacje użytkownika 1
    const user1Conversations = await knex("ConversationUser")
      .where("UserId", userId1)
      .select("ConversationId");

    if (user1Conversations.length === 0) {
      return null;
    }

    const conversationIds = user1Conversations.map((c) => c.ConversationId);

    // Sprawdź czy którakolwiek z tych konwersacji ma także użytkownika 2
    const sharedConversation = await knex("ConversationUser")
      .join(
        "Conversation",
        "ConversationUser.ConversationId",
        "Conversation.ConversationId"
      )
      .whereIn("ConversationUser.ConversationId", conversationIds)
      .where("ConversationUser.UserId", userId2)
      .select("Conversation.ConversationId", "Conversation.Name")
      .first();

    return sharedConversation || null;
  } catch (error) {
    console.error(
      "Błąd podczas wyszukiwania konwersacji między użytkownikami:",
      error
    );
    throw error;
  }
}

module.exports = {
  findUserByUsername,
  getUserKeys,
  checkUserExists,
  checkEmailExists,
  getUserById,
  getUserConversations,
  getMessagesInConversation,
  findConversationBetweenUsers,
  getConversationById,
};
