const express = require('express');
const fs = require('fs');
const { startBot } = require('./bot');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

let botRunning = false;

// 1. API for saving appstate
app.post('/api/appstate', (req, res) => {
    const { appstate } = req.body;
    if (!appstate) {
        return res.status(400).json({ success: false, message: 'No appstate data!' });
    }
    try {
        JSON.parse(appstate); // Check if JSON is valid
        fs.writeFileSync('appstate.json', appstate);
        res.json({ success: true, message: '✅ appstate.json saved!' });
    } catch (e) {
        res.status(400).json({ success: false, message: '❌ Incorrect JSON: ' + e.message });
    }
});

// 2. API to start bots
app.post('/api/start', (req, res) => {
    if (botRunning) {
        return res.json({ success: true, message: '⏳ Bot is already running!' });
    }
    try {
        const started = startBot();
        if (started) {
            botRunning = true;
            res.json({ success: true, message: '🚀 Bot launched successfully!' });
        } else {
            res.status(500).json({ success: false, message: '❌ appstate.json not found!' });
        }
    } catch (e) {
        res.status(500).json({ success: false, message: '❌ Error: ' + e.message });
    }
});

app.listen(PORT, () => {
    console.log(`🌐 Web UI launched: http://localhost:${PORT}`);
    console.log('💡 Place the HTML file in the "public" folder.');
});
