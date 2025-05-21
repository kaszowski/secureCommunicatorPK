/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex)
{
  await knex.raw('DROP TABLE IF EXISTS "ConversationUser" CASCADE');
  await knex.schema.createTable('ConversationUser', function(table)
  {
    table.uuid('UserId').notNullable();
    table.uuid('ConversationId').notNullable();
    table.smallint('Attributes').nullable();
    table.primary(['UserId', 'ConversationId']);
    table.foreign('UserId').references('UserId').inTable('User').onDelete('CASCADE');
    table.foreign('ConversationId').references('ConversationId').inTable('Conversation').onDelete('CASCADE');
  })
  .then(() => {
    return knex.raw('CREATE INDEX IF NOT EXISTS idx_conversationuser_userid ON "ConversationUser" ("UserId")');
  })
  .then(() => {
    return knex.raw('CREATE INDEX IF NOT EXISTS idx_conversationuser_conversationid ON "ConversationUser" ("ConversationId")');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) 
{
  await knex.raw('DROP TABLE IF EXISTS "ConversationUser" CASCADE');
};
