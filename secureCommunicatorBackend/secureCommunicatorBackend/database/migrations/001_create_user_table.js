/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) 
{
  await knex.raw('DROP TABLE IF EXISTS "User" CASCADE');
  await knex.schema.createTable('User', function(table) 
  {
    table.uuid('UserId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('Username', 255).notNullable().unique();
    table.string('UsernameShow', 255).notNullable();
    table.string('PasswordHash', 255).notNullable();
    table.string('Email', 255).notNullable().unique();
    table.timestamp('UpdatedAt').defaultTo(knex.fn.now());
    table.text('PublicKey').notNullable();
    table.text('PrivateKey').nullable();
  })
  .then(() => {
    return knex.raw('CREATE INDEX IF NOT EXISTS idx_user_publickey ON "User" ("PublicKey")');
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
