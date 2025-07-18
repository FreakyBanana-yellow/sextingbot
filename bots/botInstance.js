import { Telegraf } from 'telegraf';
import { applyRouter } from '../router.js';
import { getModelByBotToken, getUserByTelegramId } from '../utils/supabase.js';

/**
 * Startet einen einzelnen Bot mit gegebener Konfiguration
 * @param {Object} config { botToken, botUsername }
 */
export default async function startBot(config) {
  try {
    const bot = new Telegraf(config.botToken);
    const model = await getModelByBotToken(config.botToken);

    if (!model) {
      console.warn(`❌ Kein Model für Bot ${config.botUsername} gefunden.`);
      return;
    }

    console.log('Model geladen:', {
      id: model.id,
      name: model.name,
      telegram_id: model.telegram_id,
      bot_username: model.bot_username,
      bot_name: model.bot_name
    });

    model.supabase = (await import('../utils/supabase.js')).supabase;

    // /start-Befehl
    bot.command('start', async (ctx) => {
      const userId = ctx.from?.id;

      if (String(model.telegram_id) === String(userId)) {
        return ctx.reply(`✨ Willkommen zurück, ${model.name}! Du kannst jetzt Szenen setzen, Captions einfügen oder Medien senden.`);
      }

      const user = await getUserByTelegramId(userId);
      if (user) {
        return ctx.reply(`Hey 😘 Willkommen bei ${model.bot_name}!\nWas möchtest du heute erleben?`);
      }

      return ctx.reply('👀 Du bist weder als Model noch als User bekannt.');
    });

    // Router (Message & Callback Handling)
    applyRouter(bot, model);

    await bot.launch();
    console.log(`✅ Bot gestartet: ${model.bot_name} (${config.botUsername})`);
  } catch (err) {
    console.error(`❌ Fehler beim Starten des Bots ${config.botUsername}:`, err);
  }
}
