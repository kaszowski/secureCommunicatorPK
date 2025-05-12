/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex)
{
  await knex('User').del()
  await knex('User').insert([
    {
      UserId: knex.raw('gen_random_uuid()'),
      Username: 'bobmarley',
      UsernameShow: 'Bob Marley',
      PasswordHash: 'password_hash1',
      Email: 'bobmarley@example.com',
      UpdatedAt: new Date('2025-04-30T10:00:00Z'),
      PublicKey: 'fake_public_key_1',
      PrivateKey: 'fake_private_key_1'
    },
    {
      UserId: knex.raw('gen_random_uuid()'),
      Username: 'alicejenson',
      UsernameShow: 'Alice Jenson',
      PasswordHash: 'password_hash2',
      Email: 'alicejenson@example.com',
      UpdatedAt: new Date('2025-04-30T11:00:00Z'),
      PublicKey: 'fake_public_key_2',
      PrivateKey: 'fake_private_key_2'
    },
  ]);
};
