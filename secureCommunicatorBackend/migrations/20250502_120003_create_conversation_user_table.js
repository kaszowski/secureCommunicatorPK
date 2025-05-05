/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) 
{
  await knex.schema.createTable('ConversationUser', function(table) 
  {
    table.uuid('user_id').notNullable();
    table.uuid('conversation_id').notNullable();
    table.smallint('attributes').nullable();
    table.primary(['user_id', 'conversation_id']); // Klucz główny złożony
    table.foreign('user_id').references('user_id').inTable('User').onDelete('CASCADE');
    table.foreign('conversation_id').references('conversation_id').inTable('Conversation').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) 
{
  await knex.schema.dropTableIfExists('ConversationUser');
};
