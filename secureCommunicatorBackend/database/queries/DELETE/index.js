const knexConfig = require('../../../knexfile').development;
const knex = require('knex')(knexConfig);

module.exports = 
{
    async deleteUser(username, passwordHash)
    {
        return knex.transaction(async (trx) => 
        {
            const user = await trx('User')
                .where({
                    Username: username,
                    PasswordHash: passwordHash,
                })
                .first('UserId');

            if (!user) {
                console.log('Użytkownik nie znaleziony lub hasło nieprawidłowe.');
                throw new Error('User not found or password incorrect.');
            }

            const userId = user.UserId;
            console.log(`Znaleziono użytkownika: ${username} (ID: ${userId}). Rozpoczynanie procesu usuwania.`);

            await trx('UserLogins')
                .where('UserId', userId)
                .del();

            await trx('BlockedUser')
                .where('UserId', userId)
                .del();
            
            await trx('BlockedUser')
                .where('BlockedUserId', userId)
                .del();

            const userConversations = await trx('ConversationUser')
                .where('UserId', userId)
                .select('ConversationId');

            const conversationIds = userConversations.map(uc => uc.ConversationId);

            if (conversationIds.length > 0) 
            {
                console.log(`Znaleziono konwersacje: ${conversationIds.join(', ')}. Aktualizowanie statusu na 1.`);
                await trx('Conversation')
                    .whereIn('ConversationId', conversationIds)
                    .update(
                    {
                        Status: 1,
                        StatusTimestamp: knex.fn.now()
                    });
            } 
            else 
            {
                console.log(`Brak konwersacji powiązanych z UserId: ${userId}.`);
            }

            await trx('ConversationUser')
                .where('UserId', userId)
                .del();

            console.log(`Usuwanie użytkownika UserId: ${userId} z tabeli User.`);
            const deletedUserCount = await trx('User')
                .where('UserId', userId)
                .del();
            
            if (deletedUserCount > 0) 
            {
                console.log(`Użytkownik ${username} (ID: ${userId}) został pomyślnie usunięty.`);
                return { success: true, message: `User ${username} deleted successfully.` };
            }
             else 
            {
                console.error(`Nie udało się usunąć użytkownika ${username} (ID: ${userId}) z tabeli User.`);
                throw new Error('Failed to delete user from User table.');
            }
        })
        .then(result => 
        {
            console.log('Transakcja usuwania użytkownika zakończona sukcesem.');
            return result;
        })
        .catch(error => 
        {
            console.error('Błąd podczas usuwania użytkownika, transakcja została wycofana:', error.message);
            return { success: false, message: error.message || 'Failed to delete user due to an unspecified error.' };
        });
    }
};