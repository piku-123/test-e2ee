const { FBClient } = require("fb-messenger-e2ee");

const client = new FBClient({
  appStatePath: "./appstate.json",
  sessionStorePath: "./session.json",
  platform: "facebook",
});

async function main() {
  const { userId } = await client.connect();
  console.log("[BOT] Logged in as:", userId);

  await client.connectE2EE("./device-store.json", userId);
  console.log("[BOT] E2EE ready. Listening...");

  client.onEvent(async (event) => {
    if (event.type === "e2ee_connected") {
      console.log("[BOT] E2EE stream connected!");
    }

    if (event.type === "e2ee_message") {
      const { threadId, senderJid, text } = event.data;
      console.log(`[MSG] ${threadId} | ${senderJid} | "${text}"`);

      if (text?.trim().toLowerCase() === "/ping") {
        await client.sendMessage({ threadId, text: "🏓 Pong! Bot is alive." });
        console.log("[BOT] Pong sent!");
      }
    }

    if (event.type === "error") {
      console.error("[ERROR]", event.data.message);
    }
  });
}

main().catch(err => { console.error("[FATAL]", err); process.exit(1); });
