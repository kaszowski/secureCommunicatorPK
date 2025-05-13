/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) 
{
  await knex.raw('DROP TABLE IF EXISTS "Conversation" CASCADE');
  await knex.schema.createTable('Conversation', function(table)
  {
    table.uuid('ConversationId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('Name', 255).nullable();
    table.binary('Avatar').nullable(); // BYTEA to binary
    table.binary('Background').nullable(); // BYTEA to binary
    table.smallint('Status').defaultTo(0); // Dodano
    table.timestamp('StatusTimestamp').defaultTo(knex.fn.now()); // Dodano
    table.check('"Status" IN (0, 1)'); // Dodano
  })
  .then(() => {
    return knex.raw('CREATE INDEX IF NOT EXISTS idx_conversation_name ON "Conversation" ("Name")');
  })
  .then(() => {
    return knex.raw('CREATE INDEX IF NOT EXISTS idx_conversation_status ON "Conversation" ("Status")');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) 
{
  await knex.raw('DROP TABLE IF EXISTS "Conversation" CASCADE');
};