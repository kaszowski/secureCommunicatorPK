/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) 
{
  await knex.raw('DROP TABLE IF EXISTS "UserLogins" CASCADE');
  await knex.schema.createTable('UserLogins', function(table)
  {
    table.increments('UserLoginId').primary();
    table.uuid('UserId').notNullable();
    table.timestamp('LoginTimestamp').notNullable().defaultTo(knex.fn.now());
    table.string('IpAddress', 45).nullable();
    table.boolean('Success').notNullable();
    table.foreign('UserId').references('UserId').inTable('User').onDelete('CASCADE');
  })
  .then(() => {
    return knex.raw('CREATE INDEX IF NOT EXISTS idx_userlogins_userid ON "UserLogins" ("UserId")');
  })
  .then(() => {
    return knex.raw('CREATE INDEX IF NOT EXISTS idx_userlogins_userid_logintimestamp ON "UserLogins" ("UserId", "LoginTimestamp" DESC)');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) 
{
  await knex.raw('DROP TABLE IF EXISTS "UserLogins" CASCADE');
};