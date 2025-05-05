/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) 
{
  // Usuń istniejące wpisy w UserLogins
  await knex('UserLogins').del();

  // Pobierz ID użytkowników
  const bobMarley = await knex('User').where({ username: 'bobmarley' }).first('user_id');
  const aliceJenson = await knex('User').where({ username: 'alicejenson' }).first('user_id');

  if (!bobMarley || !aliceJenson) 
    {
    console.error("Nie znaleziono użytkowników 'bobmarley' lub 'alicejenson'. Upewnij się, że seed 01_users został uruchomiony.");
    return;
  }

  // Wstaw dane logowania
  await knex('UserLogins').insert([
    // Logowania dla bobmarley
    { user_id: bobMarley.user_id, login_timestamp: new Date('2025-04-30T10:10:00Z'), ip_address: '192.168.1.10', success: true },
    { user_id: bobMarley.user_id, login_timestamp: new Date('2025-04-30T12:15:30Z'), ip_address: '192.168.1.10', success: true },
    { user_id: bobMarley.user_id, login_timestamp: new Date('2025-04-30T14:05:00Z'), ip_address: '10.0.0.5', success: false },
    // Logowania dla alicejenson
    { user_id: aliceJenson.user_id, login_timestamp: new Date('2025-04-30T11:50:00Z'), ip_address: '108.10.13.9', success: false },
    { user_id: aliceJenson.user_id, login_timestamp: new Date('2025-04-30T13:30:15Z'), ip_address: '203.0.113.25', success: true },
    { user_id: aliceJenson.user_id, login_timestamp: new Date('2025-04-30T15:45:00Z'), ip_address: '203.0.113.25', success: true },
  ]);
};