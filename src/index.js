require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const db = require("./db");

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// ─── Config API ────────────────────────────────────────────────────────────────

// GET current config (for dashboard to load saved values)
app.get("/api/config", (req, res) => {
  const config = db.getConfig();
  res.json(config);
});

// POST save config from dashboard
app.post("/api/config", (req, res) => {
  const { fb_email, fb_password, fb_state } = req.body;
  db.saveConfig({ fb_email, fb_password, fb_state });
  res.json({ success: true, message: "Config saved!" });
});

// ─── Bot Start ──────────────────────────────────────────────────────────────────

let botRunning = false;
let botClient = null;

app.post("/api/start", async (req, res) => {
  if (botRunning) {
    return res.json({ success: false, message: "Bot is already running." });
  }

  const config = db.getConfig();

  if (!config.fb_email || !config.fb_password) {
    return res.status(400).json({ success: false, message: "Email/Password missing. Save config first." });
  }

  try {
    // Dynamically import fb-messenger-e2ee (ESM package)
    const { default: Messenger } = await import("fb-messenger-e2ee");

    const loginOptions = config.fb_state
      ? { state: JSON.parse(config.fb_state) }
      : { email: config.fb_email, password: config.fb_password };

    botClient = await Messenger.connect(loginOptions);
    botRunning = true;

    db.addLog("Bot started successfully.");
    console.log("[BOT] Connected to Messenger.");

    // ─── Listen for messages ──────────────────────────────────────────────────
    botClient.listen((message) => {
      const text = message?.body?.toLowerCase()?.trim();
      const threadID = message?.threadID;

      if (!text || !threadID) return;

      db.addLog(`Message received: "${text}" from thread ${threadID}`);

      if (text === "/ping") {
        botClient.sendMessage({ body: "🏓 Pong! Bot is alive and working in inbox." }, threadID);
        db.addLog(`Replied with Pong to thread ${threadID}`);
      }
    });

    res.json({ success: true, message: "Bot started! Listening for /ping..." });
  } catch (err) {
    botRunning = false;
    db.addLog(`Error starting bot: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/stop", (req, res) => {
  if (!botRunning) {
    return res.json({ success: false, message: "Bot is not running." });
  }
  try {
    if (botClient?.stopListening) botClient.stopListening();
    botRunning = false;
    botClient = null;
    db.addLog("Bot stopped.");
    res.json({ success: true, message: "Bot stopped." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/status", (req, res) => {
  res.json({ running: botRunning });
});

app.get("/api/logs", (req, res) => {
  const logs = db.getLogs();
  res.json(logs);
});

// ─── Server ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[SERVER] Running on http://localhost:${PORT}`);
});
