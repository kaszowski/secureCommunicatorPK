const knexConfig = require("../../../knexfile").development;
const knex = require("knex")(knexConfig);

/**
 * Aktualizuje dane użytkownika.
 * @param {string} userId - ID użytkownika do aktualizacji.
 * @param {object} updates - Obiekt zawierający pola do aktualizacji oraz `currentPassword`.
 *                           Pola do aktualizacji mogą obejmować: `username`, `usernameShow`, `email`, `newPassword`.
 *                           Pole `currentPassword` (obecne hasło użytkownika) jest wymagane do autoryzacji jakiejkolwiek zmiany
 *                           i musi zgadzać się z hasłem przechowywanym w bazie danych.
 * @returns {Promise<boolean>} True, jeśli aktualizacja się powiodła. False, jeśli użytkownik nie został znaleziony
 *                             lub jeśli nie podano żadnych danych do zmiany (poza `currentPassword`).
 * @throws {Error} Rzuca błąd w następujących przypadkach:
 *                 - Jeśli `updates.currentPassword` nie jest podane lub jest nieprawidłowe.
 *                 - Jeśli `updates.newPassword` jest takie samo jak obecne hasło.
 *                 - Jeśli nowa nazwa użytkownika (`updates.username`) jest już zajęta.
 *                 - Jeśli nowy adres email (`updates.email`) jest już używany.
 *                 - W przypadku innych błędów bazy danych lub niepowodzenia operacji.
 */
async function updateUser(userId, updates) {
  try {
    const user = await knex("User").where({ UserId: userId }).first();
    if (!user) {
      // Użytkownik nie znaleziony
      return false;
    }

    // Sprawdzenie obecnego hasła
    if (
      !updates.currentPassword ||
      user.PasswordHash !== updates.currentPassword
    ) {
      throw new Error("Podane obecne hasło jest nieprawidłowe.");
    }

    const updateData = {};

    if (updates.username && updates.username !== user.Username) {
      updateData.Username = updates.username;
    }

    if (updates.usernameShow && updates.usernameShow !== user.UsernameShow) {
      updateData.UsernameShow = updates.usernameShow;
    }

    if (updates.email && updates.email !== user.Email) {
      updateData.Email = updates.email;
    }

    if (updates.newPassword) {
      if (user.PasswordHash === updates.newPassword) {
        throw new Error("Nowe hasło nie może być takie samo jak obecne.");
      }
      updateData.PasswordHash = updates.newPassword;
    }

    if (Object.keys(updateData).length === 0) {
      return false; // Brak danych do aktualizacji lub dane są takie same
    }

    updateData.UpdatedAt = knex.fn.now();

    const updatedCount = await knex("User")
      .where({ UserId: userId })
      .update(updateData);

    return updatedCount > 0;
  } catch (error) {
    if (
      error.message === "Podane obecne hasło jest nieprawidłowe." ||
      error.message === "Nowe hasło nie może być takie samo jak obecne."
    ) {
      throw error;
    }
    if (error.constraint === "User_username_key") {
      throw new Error("Nazwa użytkownika jest już zajęta.");
    }
    if (error.constraint === "User_email_key") {
      throw new Error("Adres email jest już używany.");
    }

    throw new Error("Nie udało się zaktualizować użytkownika.");
  }
}

module.exports = {
  updateUser,
};
