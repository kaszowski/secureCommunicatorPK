/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex)
{
  await knex.schema.createTable('BlockedUser', function(table)
  {
    table.uuid('BlockId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('UserId').notNullable();
    table.uuid('BlockedUserId').notNullable();
    table.timestamp('Timestamp').defaultTo(knex.fn.now()); 

    table.foreign('UserId').references('UserId').inTable('User').onDelete('CASCADE');
    table.foreign('BlockedUserId').references('UserId').inTable('User').onDelete('CASCADE');
  })
  .then(() => {
    return knex.raw('CREATE INDEX IF NOT EXISTS idx_blockeduser_userid ON "BlockedUser" ("UserId")');
  })
  .then(() => {
    return knex.raw('CREATE INDEX IF NOT EXISTS idx_blockeduser_blockeduserid ON "BlockedUser" ("BlockedUserId")');
  })
  .then(() => {
    return knex.raw('CREATE INDEX IF NOT EXISTS idx_blockeduser_timestamp ON "BlockedUser" ("Timestamp")');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex)
{
  await knex.schema.dropTableIfExists('BlockedUser');
};
