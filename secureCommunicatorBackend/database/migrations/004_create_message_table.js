/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) 
{
  await knex.raw('DROP TABLE IF EXISTS "Message" CASCADE');
  await knex.schema.createTable('Message', function(table) 
  {
    table.uuid('MessageId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('UserId').notNullable();
    table.uuid('ConversationId').notNullable();
    table.text('Content').notNullable();
    table.timestamp('SendAt').defaultTo(knex.fn.now());
    table.foreign('UserId').references('UserId').inTable('User').onDelete('CASCADE');
    table.foreign('ConversationId').references('ConversationId').inTable('Conversation').onDelete('CASCADE');
  })
  .then(() => {
    return knex.raw('CREATE INDEX IF NOT EXISTS idx_message_userid ON "Message" ("UserId")');
  })
  .then(() => {
    return knex.raw('CREATE INDEX IF NOT EXISTS idx_message_conversationid ON "Message" ("ConversationId")');
  })
  .then(() => {
    return knex.raw('CREATE INDEX IF NOT EXISTS idx_message_conversation_sendat ON "Message" ("ConversationId", "SendAt" DESC)');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) 
{
  await knex.raw('DROP TABLE IF EXISTS "Message" CASCADE');
};
