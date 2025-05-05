/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) 
{
  await knex.schema.createTable('Message', function(table) 
  {
    table.uuid('message_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.uuid('conversation_id').notNullable();
    table.text('content').notNullable();
    table.timestamp('send_at').notNullable().defaultTo(knex.fn.now());
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
  await knex.schema.dropTableIfExists('Message');
};
