/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Usuwamy istniejące dane w odpowiedniej kolejności (zależności kluczy obcych)
  await knex("Message").del();
  await knex("ConversationUser").del();
  await knex("Conversation").del();

  // Pobieramy ID użytkowników
  const bobMarley = await knex("User")
    .where({ Username: "bobmarley" })
    .first("UserId");
  const aliceJenson = await knex("User")
    .where({ Username: "alicejenson" })
    .first("UserId");

  if (!bobMarley || !aliceJenson) {
    console.error(
      "Nie znaleziono użytkowników 'bobmarley' lub 'alicejenson'. Upewnij się, że seed 01_users został uruchomiony."
    );
    return;
  }

  const [newConversation] = await knex("Conversation")
    .insert({
      ConversationId: knex.raw("gen_random_uuid()"),
      Name: "Bob & Alice Chat",
    })
    .returning("ConversationId");

  const conversationId = newConversation.ConversationId;

  if (!conversationId) {
    console.error("Nie udało się utworzyć konwersacji lub pobrać jej ID.");
    return;
  }

  await knex("ConversationUser").insert([
    {
      UserId: bobMarley.UserId,
      ConversationId: conversationId,
      Attributes: null,
      EncryptedConversationKey:
        "H9bcbgZ9MKu8JYoJpN78z0v4zoWKqEhrA+oLmRusUeB+28N/hU7zYs4WdWPOPOT/mHzUl8aqT8kEcw+Z5WVvDdCMQkSNP0oRZ74I0LD1BhZa0rrc6utI4Fb9PUozHqx4MmeCPPHeBZHqo3tVv5LKiIhgVbX80uMeGNsVqRY7NjV9dypMF+Xnq6ciAOfLu+EP6/ysLTYqgOqRnd1ltGBRGNvTmcHrZ2muYXB89hpc/s2k8XZpEES7qOXlVUSqsTLUf+dIo5chsJpY+pA83BiO/fxlz6LKWlkb0yERsqu4d/AZd33Cjp6SvMIYaKFLZuci+kfZSBbBpdAKk0AV1GmZxg==",
    },
    {
      UserId: aliceJenson.UserId,
      ConversationId: conversationId,
      Attributes: null,
      EncryptedConversationKey:
        "YcpESg4Ic/7I8xTObZEXRaWBszkccR1RD9hi4KUOgmXf+AsOPlL/1BPjbGtF8XbdnToqurOR0aB6zxRaWbEeTx7CFaVYOLwKmplgYeQGWcO4njesLtgi7XTsY788R5DUeYtORuh2nB0KhIcLQyWL56MZSYLT8XiNgXP+wlYBykx4bTX76aPVgeteuJCtj6sSHkHCiWhrOtcGEl3f1xVexEjz4x0EVbLtYNkutcneFnWSXlZI3SewU7IcF9l6UACvyYXtNhPo6hvdAaa7QTwNpsxlxlk0u6tNrRxUcS4jsKG6fkQhFoCNlZv4Js8JC1+k/5Y9FsMM4NtmHa/HmIvDYQ==",
    },
  ]);

  await knex("Message").insert([
    {
      MessageId: knex.raw("gen_random_uuid()"),
      UserId: bobMarley.UserId,
      ConversationId: conversationId,
      Content: Buffer.from("Hey Alice!", "utf8"),
      SendAt: new Date("2025-04-30T16:00:00Z"),
    },
    {
      MessageId: knex.raw("gen_random_uuid()"),
      UserId: aliceJenson.UserId,
      ConversationId: conversationId,
      Content: Buffer.from("Hi Bob! How are you?", "utf8"),
      SendAt: new Date("2025-04-30T16:01:00Z"),
    },
    {
      MessageId: knex.raw("gen_random_uuid()"),
      UserId: bobMarley.UserId,
      ConversationId: conversationId,
      Content: Buffer.from(
        "Doing great, thanks! Just testing this chat.",
        "utf8"
      ),
      SendAt: new Date("2025-04-30T16:02:00Z"),
    },
    {
      MessageId: knex.raw("gen_random_uuid()"),
      UserId: aliceJenson.UserId,
      ConversationId: conversationId,
      Content: Buffer.from("Looks like it works!", "utf8"),
      SendAt: new Date("2025-04-30T16:03:00Z"),
    },
  ]);
};
