/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) 
{
  await knex.schema.createTable('UserLogins', function(table) 
  {
    table.increments('user_login_id').primary(); // increments() zazwyczaj mapuje się na SERIAL w PostgreSQL
    table.uuid('user_id').notNullable();
    table.timestamp('login_timestamp').notNullable().defaultTo(knex.fn.now()); // Użyj knex.fn.now() dla CURRENT_TIMESTAMP
    table.string('ip_address', 45).nullable();
    table.boolean('success').notNullable();
    table.foreign('user_id').references('user_id').inTable('User').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) 
{
  await knex.schema.dropTableIfExists('UserLogins');
};