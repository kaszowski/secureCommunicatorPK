/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) 
{
  // Usuń istniejące dane w odpowiedniej kolejności (zależności kluczy obcych)
  await knex('Message').del();
  await knex('ConversationUser').del();
  await knex('Conversation').del();

  // Pobierz ID użytkowników
  const bobMarley = await knex('User').where({ username: 'bobmarley' }).first('user_id');
  const aliceJenson = await knex('User').where({ username: 'alicejenson' }).first('user_id');

  if (!bobMarley || !aliceJenson) 
{
    console.error("Nie znaleziono użytkowników 'bobmarley' lub 'alicejenson'. Upewnij się, że seed 01_users został uruchomiony.");
    return;
  }

  // 1. Utwórz nową konwersację i pobierz jej ID
  const [newConversation] = await knex('Conversation')
    .insert({
      conversation_id: knex.raw('gen_random_uuid()'),
      name: 'Bob & Alice Chat'
    })
    .returning('conversation_id'); // Pobierz zwrócone ID

  const conversationId = newConversation.conversation_id;

  if (!conversationId) 
  {
      console.error("Nie udało się utworzyć konwersacji lub pobrać jej ID.");
      return;
  }

  // 2. Dodaj użytkowników do konwersacji
  await knex('ConversationUser').insert([
    { user_id: bobMarley.user_id, conversation_id: conversationId, attributes: null },
    { user_id: aliceJenson.user_id, conversation_id: conversationId, attributes: null },
  ]);

  // 3. Dodaj wiadomości do konwersacji
  await knex('Message').insert([
    {
      message_id: knex.raw('gen_random_uuid()'),
      user_id: bobMarley.user_id,
      conversation_id: conversationId,
      content: 'Hey Alice!',
      send_at: new Date('2025-04-30T16:00:00Z')
    },
    {
      message_id: knex.raw('gen_random_uuid()'),
      user_id: aliceJenson.user_id,
      conversation_id: conversationId,
      content: 'Hi Bob! How are you?',
      send_at: new Date('2025-04-30T16:01:00Z')
    },
    {
      message_id: knex.raw('gen_random_uuid()'),
      user_id: bobMarley.user_id,
      conversation_id: conversationId,
      content: 'Doing great, thanks! Just testing this chat.',
      send_at: new Date('2025-04-30T16:02:00Z')
    },
    {
      message_id: knex.raw('gen_random_uuid()'),
      user_id: aliceJenson.user_id,
      conversation_id: conversationId,
      content: 'Looks like it works!',
      send_at: new Date('2025-04-30T16:03:00Z')
    },
  ]);
};
