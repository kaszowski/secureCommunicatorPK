/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) 
{
  await knex.schema.createTable('User', function(table) 
  {
    table.uuid('user_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('username', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('email', 255).notNullable().unique();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.text('public_key').notNullable();
    table.text('private_key').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) 
{
  await knex.schema.dropTableIfExists('User');
};
