/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) 
{
  // Usuwamy istniejące dane w odpowiedniej kolejności (zależności kluczy obcych)
  await knex('Message').del();
  await knex('ConversationUser').del();
  await knex('Conversation').del();
  
  // Pobieramy ID użytkowników
  const bobMarley = await knex('User').where({ Username: 'bobmarley' }).first('UserId');
  const aliceJenson = await knex('User').where({ Username: 'alicejenson' }).first('UserId');

  if (!bobMarley || !aliceJenson) 
  {
    console.error("Nie znaleziono użytkowników 'bobmarley' lub 'alicejenson'. Upewnij się, że seed 01_users został uruchomiony.");
    return;
  }

  const [newConversation] = await knex('Conversation')
    .insert({
      ConversationId: knex.raw('gen_random_uuid()'),
      Name: 'Bob & Alice Chat'
    })
    .returning('ConversationId');

  const conversationId = newConversation.ConversationId;

  if (!conversationId) 
  {
      console.error("Nie udało się utworzyć konwersacji lub pobrać jej ID.");
      return;
  }

  await knex('ConversationUser').insert([
    { UserId: bobMarley.UserId, ConversationId: conversationId, Attributes: null },
    { UserId: aliceJenson.UserId, ConversationId: conversationId, Attributes: null },
  ]);

  await knex('Message').insert([
    {      MessageId: knex.raw('gen_random_uuid()'),
      UserId: bobMarley.UserId,
      ConversationId: conversationId,
      Content: 'Hey Alice!',
      SendAt: new Date('2025-04-30T16:00:00Z')
    },
    {      MessageId: knex.raw('gen_random_uuid()'),
      UserId: aliceJenson.UserId,
      ConversationId: conversationId,
      Content: 'Hi Bob! How are you?',
      SendAt: new Date('2025-04-30T16:01:00Z')
    },
    {      MessageId: knex.raw('gen_random_uuid()'),
      UserId: bobMarley.UserId,
      ConversationId: conversationId,
      Content: 'Doing great, thanks! Just testing this chat.',
      SendAt: new Date('2025-04-30T16:02:00Z')
    },
    {      MessageId: knex.raw('gen_random_uuid()'),
      UserId: aliceJenson.UserId,
      ConversationId: conversationId,
      Content: 'Looks like it works!',
      SendAt: new Date('2025-04-30T16:03:00Z')
    },
  ]);
};
