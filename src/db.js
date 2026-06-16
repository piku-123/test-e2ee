const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const db = new Database(path.join(DATA_DIR, "bot.db"));

// ─── Setup tables ─────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS config (
    key   TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS logs (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    message   TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ─── Config helpers ───────────────────────────────────────────────────────────

function saveConfig({ fb_email, fb_password, fb_state }) {
  const upsert = db.prepare(`INSERT INTO config (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`);

  const entries = { fb_email, fb_password, fb_state };
  for (const [key, val] of Object.entries(entries)) {
    if (val !== undefined) upsert.run(key, val ?? "");
  }
}

function getConfig() {
  const rows = db.prepare("SELECT key, value FROM config").all();
  return rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

// ─── Log helpers ──────────────────────────────────────────────────────────────

function addLog(message) {
  db.prepare("INSERT INTO logs (message) VALUES (?)").run(message);
  console.log(`[LOG] ${message}`);
}

function getLogs(limit = 50) {
  return db.prepare("SELECT * FROM logs ORDER BY id DESC LIMIT ?").all(limit);
}

module.exports = { saveConfig, getConfig, addLog, getLogs };
