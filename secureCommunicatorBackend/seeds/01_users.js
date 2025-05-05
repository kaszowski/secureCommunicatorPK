/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex)
{
  await knex('User').del()

  await knex('User').insert([
    {
      user_id: knex.raw('gen_random_uuid()'),
      username: 'bobmarley',
      password_hash: 'password_hash1',
      email: 'bobmarley@example.com',
      updated_at: new Date('2025-04-30T10:00:00Z'),
      public_key: 'fake_public_key_1',
      private_key: 'fake_private_key_1'
    },
    {
      user_id: knex.raw('gen_random_uuid()'),
      username: 'alicejenson',
      password_hash: 'password_hash2',
      email: 'alicejenson@example.com',
      updated_at: new Date('2025-04-30T11:00:00Z'),
      public_key: 'fake_public_key_2',
      private_key: 'fake_private_key_2'
    },
  ]);
};
