const fs = require('fs');
const login = require('@vangbanlanhat/fca-unofficial');
const { makeStart } = require('fb-messenger-e2ee');

function startBot() {
    let appState;
    try {
        appState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
    } catch (e) {
        console.error('❌ appstate.json Not found!');
        return false;
    }

    login({ appState: appState }, (err, api) => {
        if (err) {
            console.error('❌ Login failed:', err);
            return;
        }

        const startE2EE = makeStart(api);
        startE2EE().then(() => {
            console.log('✅ E2EE enabled! (Secret Chat Ready)');
        }).catch(e => console.error('E2EE এরর:', e));

        console.log('🤖 Bot is up and running. Test /ping your inbox.');

        api.listenMqtt((err, event) => {
            if (err) return console.error('লিসেনিং এরর:', err);
            if (event.type === 'message' && event.body === '/ping') {
                api.sendMessage('🏓 Pong! (E2EE active)', event.threadID, event.messageID);
                console.log(`✅ /ping responded (thread: ${event.threadID})`);
            }
        });
    });
    return true;
}

module.exports = { startBot };
