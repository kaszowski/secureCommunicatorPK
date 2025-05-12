const knexConfig = require('../../../knexfile').development;
const knex = require('knex')(knexConfig);

/**
 * Aktualizuje dane użytkownika.
 * @param {string} userId - ID użytkownika do aktualizacji.
 * @param {object} updates - Obiekt zawierający pola do aktualizacji (np. username, usernameShow, email, newPassword).
 * @returns {Promise<boolean>} True, jeśli aktualizacja się powiodła, false w przeciwnym razie.
 */
async function updateUser(userId, updates) 
{    try 
    {
        const user = await knex('User').where({ UserId: userId }).first();
        if (!user) 
        {
            // Użytkownik nie znaleziony
            return false; 
        }        
        const updateData = {};
        
        if (updates.username && updates.username !== user.Username) 
        {
            updateData.Username = updates.username;
        }

        if (updates.usernameShow && updates.usernameShow !== user.UsernameShow)
        {
            updateData.UsernameShow = updates.usernameShow;
        }

        if (updates.email && updates.email !== user.Email) 
        {
            updateData.Email = updates.email;
        }

        if (updates.newPassword) 
        {
            if (user.PasswordHash === updates.newPassword) 
                {
                throw new Error('Nowe hasło nie może być takie samo jak obecne.');
            }
            updateData.PasswordHash = updates.newPassword;
        }

        if (Object.keys(updateData).length === 0) 
        {
            return false; // Brak danych do aktualizacji lub dane są takie same
        }        
        
        updateData.UpdatedAt = knex.fn.now();

        const updatedCount = await knex('User')
            .where({ UserId: userId })
            .update(updateData);

        return updatedCount > 0;
    }
    catch (error) 
    {
        console.error('Błąd podczas aktualizacji użytkownika:', error);
        if (error.constraint === 'User_username_key') 
        {
            throw new Error('Nazwa użytkownika jest już zajęta.');
        }
        if (error.constraint === 'User_email_key') 
        {
            throw new Error('Adres email jest już używany.');
        }
        throw new Error('Nie udało się zaktualizować użytkownika.');
    }
}

module.exports = 
{
    updateUser
};