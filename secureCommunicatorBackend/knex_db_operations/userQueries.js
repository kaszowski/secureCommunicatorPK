const knexConfig = require('../knexfile').development;
const knex = require('knex')(knexConfig);

/**
 * Rejestruje nowego użytkownika w bazie danych.
 * @param {object} userData - Dane użytkownika.
 * @param {string} userData.username - Nazwa użytkownika.
 * @param {string} userData.password_hash - Skrót hasła użytkownika.
 * @param {string} userData.email - Adres email użytkownika.
 * @param {string} userData.public_key - Klucz publiczny użytkownika.
 * @param {string} [userData.private_key] - Klucz prywatny użytkownika (opcjonalny).
 * @returns {Promise<string>} ID nowo utworzonego użytkownika.
 * @throws {Error} Jeśli wystąpi błąd podczas wstawiania danych.
 */
async function registerUser(userData) 
{
    const { username, password_hash, email, public_key, private_key } = userData;
    try 
    {
        const [newUser] = await knex('User')
            .insert({
                username: username,
                password_hash: password_hash,
                email: email,
                public_key: public_key,
                private_key: private_key // Może być null, jeśli nie podano
                // user_id jest generowany automatycznie przez bazę danych (defaultTo gen_random_uuid())
                // updated_at jest generowany automatycznie przez bazę danych (defaultTo knex.fn.now())
            })
            .returning('user_id'); // Zwraca ID wstawionego użytkownika

        if (!newUser || !newUser.user_id) 
            {
             throw new Error("Nie udało się pobrać user_id po wstawieniu użytkownika.");
        }
        console.log(`User registered successfully with ID: ${newUser.user_id}`);
        return newUser.user_id;
    } 
    catch (error) 
    {
        console.error("Error registering user:", error);
        throw error;
    }
}

/**
 * Sprawdza dane logowania użytkownika.
 * @param {string} username - Nazwa użytkownika.
 * @param {string} password_hash - Skrót hasła użytkownika.
 * @returns {Promise<string|null>} Zwraca user_id w przypadku sukcesu, w przeciwnym razie null.
 * @throws {Error} Jeśli wystąpi błąd podczas zapytania do bazy danych.
 */
async function loginUser(username, password_hash) 
{
    try 
    {
        const user = await knex('User')
            .where({
                username: username,
                password_hash: password_hash
            })
            .first('user_id'); // Pobierz tylko user_id pierwszego pasującego użytkownika

        if (user && user.user_id) 
        {
            console.log(`Login successful for user: ${username}`);
            return user.user_id;
        } 
        else 
        {
            console.log(`Login failed for user: ${username}`);
            return null; // Zwróć null, jeśli dane logowania są nieprawidłowe
        }
    } 
    catch (error) 
    {
        console.error("Error during login:", error);

        throw error;
    }
}

/**
 * Pobiera klucze publiczny i prywatny dla danego użytkownika.
 * @param {string} userId - ID użytkownika.
 * @returns {Promise<{public_key: string, private_key: string|null}|null>} Obiekt z kluczami lub null, jeśli użytkownik nie istnieje.
 * @throws {Error} Jeśli wystąpi błąd podczas zapytania do bazy danych.
 */
async function getUserKeys(userId) 
{
    try 
    {
        const keys = await knex('User')
            .where({ user_id: userId })
            .first('public_key', 'private_key'); // Pobierz klucze

        if (keys) 
        {
            console.log(`Keys retrieved for user ID: ${userId}`);
            return keys; // Zwróć obiekt { public_key, private_key }
        } 
        else 
        {
            console.log(`User not found for ID: ${userId}`);
            return null; // Zwróć null, jeśli użytkownik nie został znaleziony
        }
    } 
    catch (error) 
    {
        console.error(`Error retrieving keys for user ID ${userId}:`, error);
        throw error;         // Rzuć błąd dalej
    }
}

/**
 * Sprawdza, czy podany adres email już istnieje w bazie danych.
 * @param {string} email - Adres email do sprawdzenia.
 * @returns {Promise<boolean>} Zwraca true, jeśli email istnieje, w przeciwnym razie false.
 * @throws {Error} Jeśli wystąpi błąd podczas zapytania do bazy danych.
 */
async function checkEmailExists(email) 
{
    try 
    {

        const result = await knex('User')
            .where({ email: email })
            .first(knex.raw('1'));

        // Jeśli result nie jest undefined, to znaczy, że znaleziono pasujący email.
        const exists = !!result;
        console.log(`Email check for ${email}: ${exists ? 'exists' : 'does not exist'}`);
        return exists;
    } catch (error) {
        console.error(`Error checking email existence for ${email}:`, error);
        throw error;
    }
}

/**
 * Znajduje użytkownika po nazwie użytkownika.
 * @param {string} username - Nazwa użytkownika do wyszukania.
 * @returns {Promise<string|null>} Zwraca user_id, jeśli użytkownik zostanie znaleziony, w przeciwnym razie null.
 * @throws {Error} Jeśli wystąpi błąd podczas zapytania do bazy danych.
 */
async function findUserByUsername(username) 
{
    try 
    {
        const user = await knex('User')
            .where({ username: username })
            .first('user_id');

        if (user && user.user_id) 
            {
            console.log(`User found by username ${username}: ${user.user_id}`);
            return user.user_id;
        } 
        else 
        {
            console.log(`User not found by username: ${username}`);
            return null;
        }
    } 
    catch (error) 
    {
        console.error(`Error finding user by username ${username}:`, error);
        throw error;
    }
}

/**
 * Zmienia hasło użytkownika, jeśli obecne hasło jest poprawne. Opcjonalnie aktualizuje klucz prywatny.
 * @param {string} userId - ID użytkownika.
 * @param {string} currentPasswordHash - Obecny skrót hasła.
 * @param {string} newPasswordHash - Nowy skrót hasła.
 * @param {string} [newPrivateKey] - Opcjonalny nowy klucz prywatny.
 * @returns {Promise<string>} Zwraca status operacji: 'success', 'invalid_password', lub 'user_not_found'.
 * @throws {Error} Jeśli wystąpi błąd podczas operacji na bazie danych.
 */
async function changePassword(userId, currentPasswordHash, newPasswordHash, newPrivateKey = null)
{
    try
    {
        // Krok 1: Sprawdź, czy użytkownik o podanym ID istnieje
        const userExists = await knex('User').where({ user_id: userId }).first(knex.raw('1'));
        if (!userExists)
        {
            console.log(`Password change failed: User not found for ID: ${userId}`);
            return 'user_not_found';
        }

        // Krok 2: Przygotuj dane do aktualizacji
        const updateData =
        {
            password_hash: newPasswordHash,
            updated_at: knex.fn.now() // Użyj funkcji bazy danych do ustawienia aktualnego czasu
        };

        // Dodaj klucz prywatny do aktualizacji tylko jeśli został podany i nie jest null
        if (newPrivateKey !== null)
        {
            updateData.private_key = newPrivateKey;
        }
        // Jeśli newPrivateKey jest null, pole private_key nie zostanie dodane do updateData,
        // więc jego wartość w bazie danych pozostanie niezmieniona.

        // Krok 3: Spróbuj zaktualizować hasło, sprawdzając jednocześnie obecne hasło
        const updatedCount = await knex('User')
            .where({
                user_id: userId,
                password_hash: currentPasswordHash // Warunek sprawdzający obecne hasło
            })
            .update(updateData);

        // Krok 4: Zinterpretuj wynik aktualizacji
        if (updatedCount > 0)
        {
            // Aktualizacja powiodła się (zaktualizowano 1 wiersz)
            console.log(`Password changed successfully for user ID: ${userId}`);
            return 'success';
        }
        else
        {
            // Nie zaktualizowano żadnego wiersza. Ponieważ wiemy, że użytkownik istnieje (sprawdzone w kroku 1),
            // oznacza to, że podane obecne hasło było nieprawidłowe.
            console.log(`Password change failed for user ID: ${userId} (incorrect current password)`);
            return 'invalid_password';
        }
    }
    catch (error)
    {
        console.error(`Error changing password for user ID ${userId}:`, error);
        throw error; // Rzuć błąd dalej w przypadku problemów z bazą danych
    }
}

/**
 * Pobiera listę ID konwersacji dla danego użytkownika.
 * @param {string} userId - ID użytkownika.
 * @returns {Promise<string[]>} Tablica ID konwersacji.
 * @throws {Error} Jeśli wystąpi błąd podczas zapytania do bazy danych.
 */
async function getUserConversations(userId) 
{
    try 
    {
        const conversations = await knex('ConversationUser')
            .where({ user_id: userId })
            .select('conversation_id'); // Wybierz tylko ID konwersacji

        // Wynik będzie tablicą obiektów [{conversation_id: '...'}, ...], przekształcamy ją na tablicę stringów
        const conversationIds = conversations.map(conv => conv.conversation_id);
        console.log(`Retrieved ${conversationIds.length} conversations for user ID: ${userId}`);
        return conversationIds;
    } 
    catch (error) 
    {
        console.error(`Error retrieving conversations for user ID ${userId}:`, error);
        throw error;
    }
}

/**
 * Pobiera wiadomości z danej konwersacji z paginacją.
 * @param {string} conversationId - ID konwersacji.
 * @param {number} limit - Maksymalna liczba wiadomości do pobrania.
 * @param {number} offset - Liczba wiadomości do pominięcia (dla paginacji).
 * @returns {Promise<Array<object>>} Tablica obiektów wiadomości.
 * @throws {Error} Jeśli wystąpi błąd podczas zapytania do bazy danych.
 */
async function getMessagesInConversation(conversationId, limit, offset) 
{
    try 
    {
        const messages = await knex('Message')
            .where({ conversation_id: conversationId })
            .select('message_id', 'user_id', 'content', 'send_at')
            .orderBy('send_at', 'desc')
            .limit(limit)
            .offset(offset);

        console.log(`Retrieved ${messages.length} messages for conversation ID: ${conversationId} (limit: ${limit}, offset: ${offset})`);
        return messages;
    } 
    catch (error) 
    {
        console.error(`Error retrieving messages for conversation ID ${conversationId}:`, error);
        throw error;
    }
}

/**
 * Tworzy nową konwersację i dodaje do niej dwóch użytkowników.
 * Używa transakcji, aby zapewnić atomowość operacji.
 * @param {string} creatorId - ID użytkownika tworzącego konwersację.
 * @param {string} otherUserId - ID drugiego użytkownika dodawanego do konwersacji.
 * @returns {Promise<string|null>} ID nowo utworzonej konwersacji lub null w przypadku błędu.
 * @throws {Error} Jeśli wystąpi błąd podczas transakcji.
 */
async function createConversation(creatorId, otherUserId) {
    let newConversationId = null;
    try {
        await knex.transaction(async trx => {
            // Krok 1: Utwórz konwersację i pobierz jej ID
            const [newConversation] = await trx('Conversation')
                .insert({ name: null }) // name jest opcjonalne
                .returning('conversation_id');

            if (!newConversation || !newConversation.conversation_id) {
                throw new Error("Nie udało się utworzyć konwersacji lub pobrać jej ID.");
            }
            newConversationId = newConversation.conversation_id;

            // Krok 2: Dodaj obu użytkowników do konwersacji
            await trx('ConversationUser').insert([
                { user_id: creatorId, conversation_id: newConversationId },
                { user_id: otherUserId, conversation_id: newConversationId }
            ]);
        });

        console.log(`Conversation created successfully with ID: ${newConversationId} between users ${creatorId} and ${otherUserId}`);
        return newConversationId; // Zwróć ID po pomyślnym zakończeniu transakcji
    } 
    catch (error) 
    {
        console.error(`Error creating conversation between users ${creatorId} and ${otherUserId}:`, error);
        throw error; // Rzuć błąd dalej
    }
}


module.exports =
{
    registerUser,
    loginUser,
    getUserKeys,
    checkEmailExists,
    findUserByUsername, 
    changePassword,
    getUserConversations,
    getMessagesInConversation,
    createConversation
};
