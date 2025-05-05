/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) 
{
  await knex.schema.createTable('Conversation', function(table) 
  {
    table.uuid('conversation_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).nullable();
    table.binary('avatar').nullable(); // BYTEA to binary
    table.binary('background').nullable(); // BYTEA to binary
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) 
{
  await knex.schema.dropTableIfExists('Conversation');
};