/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) 
{
  await knex('UserLogins').del();
  // Pobieramy ID użytkowników
  const bobMarley = await knex('User').where({ Username: 'bobmarley' }).first('UserId');
  const aliceJenson = await knex('User').where({ Username: 'alicejenson' }).first('UserId');

  if (!bobMarley || !aliceJenson) 
    {
    console.error("Nie znaleziono użytkowników 'bobmarley' lub 'alicejenson'. Upewnij się, że seed 01_users został uruchomiony.");
    return;
  }
  await knex('UserLogins').insert([
    { UserId: bobMarley.UserId, LoginTimestamp: new Date('2025-04-30T10:10:00Z'), IpAddress: '192.168.1.10', Success: true },
    { UserId: bobMarley.UserId, LoginTimestamp: new Date('2025-04-30T12:15:30Z'), IpAddress: '192.168.1.10', Success: true },
    { UserId: bobMarley.UserId, LoginTimestamp: new Date('2025-04-30T14:05:00Z'), IpAddress: '10.0.0.5', Success: false },

    { UserId: aliceJenson.UserId, LoginTimestamp: new Date('2025-04-30T11:50:00Z'), IpAddress: '108.10.13.9', Success: false },
    { UserId: aliceJenson.UserId, LoginTimestamp: new Date('2025-04-30T13:30:15Z'), IpAddress: '203.0.113.25', Success: true },
    { UserId: aliceJenson.UserId, LoginTimestamp: new Date('2025-04-30T15:45:00Z'), IpAddress: '203.0.113.25', Success: true },
  ]);
};