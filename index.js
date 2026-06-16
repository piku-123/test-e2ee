const express = require("express");
const fs = require("fs-extra");

const app = express();

app.use(express.json({ limit: "20mb" }));
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

app.post("/save-appstate", async (req, res) => {
  try {
    await fs.writeJson(
      "./data/appstate.json",
      req.body,
      { spaces: 2 }
    );

    res.json({
      success: true,
      message: "AppState Saved"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Dashboard Running On ${PORT}`);
});

async function startBot() {
  try {
    const appState = await fs.readJson("./data/appstate.json");

    // Example Login
    const messenger = require("fb-messenger-e2ee");

    const client = await messenger.login({
      appState
    });

    console.log("Messenger Connected");

    client.listen(async (msg) => {
      if (!msg.body) return;

      if (msg.body.trim() === "/ping") {
        await client.sendMessage(
          msg.threadID,
          "🏓 Pong!"
        );
      }
    });
  } catch (err) {
    console.error(err);
  }
}

startBot();
