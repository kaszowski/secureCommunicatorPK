const knexConfig = require('../../../knexfile').development;
const knex = require('knex')(knexConfig);

/**
 * Znajduje użytkownika po nazwie użytkownika.
 * @param {string} username - Nazwa użytkownika.
 * @returns {Promise<object|null>} Obiekt użytkownika lub null, jeśli nie znaleziono.
 */
async function findUserByUsername(username) 
{    try 
    {
        const user = await knex('User')
            .where({ Username: username })
            .first();
        return user;
    } 
    catch (error) 
    {
        console.error('Błąd podczas wyszukiwania użytkownika po nazwie:', error);
        throw error;
    }
}

/**
 * Pobiera klucze publiczny i prywatny użytkownika.
 * @param {string} userId - ID użytkownika.
 * @returns {Promise<object|null>} Obiekt z kluczami lub null.
 */
async function getUserKeys(userId) 
{    try 
    {
        const keys = await knex('User')
            .select('PublicKey', 'PrivateKey')
            .where({ UserId: userId })
            .first();
        return keys;
    } 
    catch (error) 
    {
        console.error('Błąd podczas pobierania kluczy użytkownika:', error);
        throw error;
    }
}

/**
 * Sprawdza, czy użytkownik o podanym ID istnieje.
 * @param {string} userId - ID użytkownika.
 * @returns {Promise<boolean>} True, jeśli użytkownik istnieje, false w przeciwnym razie.
 */
async function checkUserExists(userId) 
{    try 
    {
        const result = await knex('User')
            .where({ UserId: userId })
            .first(knex.raw('1'));
        return !!result;
    } 
    catch (error)
    {
        console.error('Błąd podczas sprawdzania istnienia użytkownika:', error);
        throw error;
    }
}

/**
 * Sprawdza, czy użytkownik o podanym emailu istnieje.
 * @param {string} email - Email użytkownika.
 * @returns {Promise<boolean>} True, jeśli użytkownik z tym emailem istnieje, false w przeciwnym razie.
 */
async function checkEmailExists(email) 
{    try 
    {
        const result = await knex('User')
            .where({ Email: email })
            .first(knex.raw('1'));
        return !!result;
    } 
    catch (error)
    {
        console.error('Błąd podczas sprawdzania istnienia emaila:', error);
        throw error;
    }
}

/**
 * Pobiera dane użytkownika po ID, z wyłączeniem niektórych pól.
 * @param {string} userId - ID użytkownika.
 * @returns {Promise<object|null>} Obiekt użytkownika lub null.
 */
async function getUserById(userId) 
{    try 
    {
        const user = await knex('User')
            .select('UserId', 'Username', 'Email', 'UpdatedAt', 'PublicKey') // Wybierz tylko potrzebne pola
            .where({ UserId: userId })
            .first();
        return user;
    } 
    catch (error) 
    {
        console.error('Błąd podczas pobierania użytkownika po ID:', error);
        throw error;
    }
}

/**
 * Pobiera wszystkie konwersacje dla danego użytkownika.
 * @param {string} userId - ID użytkownika.
 * @returns {Promise<Array<object>>} Lista konwersacji.
 */
async function getUserConversations(userId) 
{    try 
    {
        const conversations = await knex('ConversationUser')
            .join('Conversation', 'ConversationUser.ConversationId', 'Conversation.ConversationId')
            .where('ConversationUser.UserId', userId)
            .select('Conversation.ConversationId', 'Conversation.Name', 'Conversation.Avatar', 'Conversation.Background');
        return conversations;
    } 
    catch (error) 
    {
        console.error('Błąd podczas pobierania konwersacji użytkownika:', error);
        throw error;
    }
}

/**
 * Pobiera wszystkie wiadomości dla danej konwersacji.
 * @param {string} conversationId - ID konwersacji.
 * @returns {Promise<Array<object>>} Lista wiadomości.
 */
async function getMessagesInConversation(conversationId) 
{    try 
    {
        const messages = await knex('Message')
            .where({ ConversationId: conversationId })
            .orderBy('SendAt', 'desc')
            .select('*');
        return messages;
    } 
    catch (error) 
    {
        console.error('Błąd podczas pobierania wiadomości dla konwersacji:', error);
        throw error;
    }
}

module.exports = 
{
    findUserByUsername,
    getUserKeys,
    checkUserExists,
    checkEmailExists,
    getUserById,
    getUserConversations,
    getMessagesInConversation
};
