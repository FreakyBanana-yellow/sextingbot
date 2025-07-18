import express from 'express';
import startBot from './bots/botInstance.js';

// Dummy-Express-Server für Render (damit ein Port gebunden ist)
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🤖 Bot läuft – alles tutti 🍌');
});

app.listen(PORT, () => {
  console.log(`🟢 Dummy-Server aktiv auf Port ${PORT}`);
});

// Liste der Bots, die gestartet werden sollen
const bots = [
  {
    botToken: '8035403206:AAEZZzzvqZHOdA3hKqepCFbovpYghe6DWlk',
    botUsername: '@LunasSexyBot'
  },
  // Weitere Bots können hier ergänzt werden:
  // { botToken: 'TOKEN2', botUsername: '@Name2' }
];

// Starte jeden Bot mit seiner Konfiguration
bots.forEach(config => {
  try {
    startBot(config);
  } catch (err) {
    console.error(`❌ Fehler beim Start von ${config.botUsername}:`, err);
  }
});
