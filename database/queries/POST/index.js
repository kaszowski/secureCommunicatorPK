const knexConfig = require('../../../knexfile');
const env = process.env.NODE_ENV || 'development';
const knex = require('knex')(knexConfig[env]);

/**
 * Uwierzytelnia użytkownika na podstawie nazwy użytkownika i hasła.
 * @param {string} username - Nazwa użytkownika.
 * @param {string} password - Hasło użytkownika.
 * @returns {Promise<number|null>} ID użytkownika (UserId) w przypadku pomyślnego uwierzytelnienia, w przeciwnym razie null.
 */
async function loginUser(username, password) 
{
    if (!username || !password) 
        {
        console.error('Błąd w loginUser: Nazwa użytkownika i hasło są wymagane.');
        return null;
    }

    try 
    {
        const user = await knex('User')
            .where({ Username: username })
            .first();

        if (user) 
        {
            const passwordMatch = (password === user.PasswordHash);
            if (passwordMatch) 
            {
                return user.UserId;
            } 
            else 
            {
                console.log(`Błąd w loginUser: Nieprawidłowe hasło dla użytkownika ${username}`);
                return null;
            }
        } 
        else 
        {
            console.log(`Błąd w loginUser: Użytkownik ${username} nie został znaleziony.`);
            return null;
        }
    } 
    catch (error) 
    {
        console.error('Błąd zapytania w loginUser:', error);
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
async function createUser(username, password, email, publicKey, privateKey) 
{
    try 
    {
        const passwordHash = password;
        const [newUser] = await knex('User')
            .insert({
                Username: username,
                UsernameShow: username,
                PasswordHash: passwordHash,
                Email: email,
                PublicKey: publicKey,
                PrivateKey: privateKey,
                // UpdatedAt jest generowany automatycznie przez bazę danych
            })
            .returning(['UserId', 'Username', 'UsernameShow', 'Email', 'PublicKey', 'UpdatedAt']);

        return newUser;
    } 
    catch (error) 
    {
        console.error('Błąd podczas tworzenia użytkownika:', error);        
        
        if (error.constraint === 'User_Username_key') 
        {
            throw new Error('Nazwa użytkownika jest już zajęta.');
        }
        if (error.constraint === 'User_Email_key') 
        {
            throw new Error('Adres email jest już używany.');
        }
        throw error;
    }
}

/**
 * Dodaje nową wiadomość do konwersacji.
 * @param {string} conversationId - ID konwersacji.
 * @param {string} userId - ID użytkownika wysyłającego wiadomość.
 * @param {string} content - Treść wiadomości.
 * @returns {Promise<object>} Obiekt nowo utworzonej wiadomości.
 */
async function addMessageToConversation(conversationId, userId, content) 
{
    try 
    {
        await knex.transaction(async trx => 
        {            
            // Sprawdzenie, czy użytkownik należy do konwersacji
            const participation = await trx('ConversationUser')
                .where({
                    UserId: userId,
                    ConversationId: conversationId
                })
                .first();

            if (!participation) 
                {
                throw new Error('Użytkownik nie należy do tej konwersacji.');
            }            const [newMessage] = await trx('Message')
                .insert({
                    UserId: userId,
                    ConversationId: conversationId,
                    Content: content,
                    // SendAt jest generowany automatycznie
                })
                .returning('*');
            return newMessage;
        });
    } 
    catch (error) 
    {
        console.error('Błąd podczas dodawania wiadomości do konwersacji:', error);
        throw error;
    }
}


module.exports = 
{
    createUser,
    addMessageToConversation,
    loginUser
};
