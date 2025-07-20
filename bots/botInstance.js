import { Telegraf } from 'telegraf';
import { applyRouter } from '../router.js';
import { getModelByBotToken, getUserByTelegramId, updateUserScene } from '../utils/supabase.js';

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

    // === /start Befehl ===
    bot.command('start', async (ctx) => {
      const userId = ctx.from?.id;

      if (String(model.telegram_id) === String(userId)) {
        return ctx.reply(`✨ Willkommen zurück, ${model.name}! Du kannst jetzt Szenen setzen, Captions einfügen oder Medien senden. Mit /hilfe kannst du alle Befehle dir anzeigen lassen.`);
      }

      // Nutzer laden oder anlegen
      let user = await getUserByTelegramId(userId);
      if (!user) {
        const { data, error } = await model.supabase
          .from('users')
          .insert([{ telegram_id: userId, current_scene: 'standard' }])
          .select()
          .single();
        if (error) return ctx.reply('⚠️ Fehler beim Anlegen des Users.');
        user = data;
      }

      // Szenen aus Medien-Tabelle laden
      const { data: scenes, error: sceneError } = await model.supabase
        .from('media')
        .select('scene')
        .eq('model_id', model.id)
        .not('scene', 'is', null)
        .neq('scene', 'standard')
        .neq('scene', 'default')
        .order('scene', { ascending: true });

      if (sceneError) {
        console.error('❌ Szenen-Fehler:', sceneError);
        return ctx.reply('❌ Konnte keine Szenen laden.');
      }

      const sceneNames = [...new Set(scenes.map(s => s.scene))]; // eindeutige Szenen

      if (sceneNames.length === 0) {
        return ctx.reply(`Hey 😘 Willkommen bei ${model.bot_name}!\nEs ist aktuell nur die Standard-Szene verfügbar.`);
      }

      const buttons = sceneNames.map(scene => [{ text: scene, callback_data: `scene_${scene}` }]);

      await ctx.reply(`Hey 😘 Willkommen bei ${model.bot_name}!\nWas möchtest du heute erleben?`, {
        reply_markup: {
          inline_keyboard: buttons
        }
      });
    });

    // === Callback für Szenenauswahl ===
    bot.on('callback_query', async (ctx) => {
      const userId = ctx.from?.id;
      const data = ctx.callbackQuery?.data;

      if (data?.startsWith('scene_')) {
        const selectedScene = data.replace('scene_', '');

        const { error } = await model.supabase
          .from('users')
          .update({ current_scene: selectedScene })
          .eq('telegram_id', userId);

        if (error) {
          console.error('❌ Fehler beim Szenenwechsel:', error);
          return ctx.answerCbQuery('Fehler beim Szenenwechsel.');
        }

        await ctx.answerCbQuery(`Szene "${selectedScene}" aktiviert ✅`);
        await ctx.reply(`🔮 Du bist jetzt in der Szene: *${selectedScene}*`, { parse_mode: 'Markdown' });
      }
    });

    // === Router für normale Messages ===
    applyRouter(bot, model);

    await bot.telegram.deleteWebhook();
    await bot.launch();
    console.log(`✅ Bot gestartet: ${model.bot_name} (${config.botUsername})`);
  } catch (err) {
    console.error(`❌ Fehler beim Starten des Bots ${config.botUsername}:`, err);
  }
}
