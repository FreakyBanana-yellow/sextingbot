import { Telegraf } from 'telegraf';
import { getModelByBotToken } from '../utils/supabase.js';
import { applyRouter } from '../router.js';
import { supabase } from '../utils/supabase.js';

export default async function startBot(config) {
  const bot = new Telegraf(config.botToken);

  const model = await getModelByBotToken(config.botToken);
  console.log('Model geladen:', model);
  if (!model) {
    console.error(`❌ Kein Model gefunden für Token: ${config.botToken}`);
    return;
  }

  // 🧠 Bot-spezifische Infos ins Model speichern
  model.supabase = supabase; // falls gebraucht
  model.username = config.botUsername;

  applyRouter(bot, model);

  bot.launch();
  console.log(`✅ Bot gestartet: ${config.botUsername}`);
}
