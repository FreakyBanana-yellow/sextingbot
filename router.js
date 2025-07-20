// Neue `router.js` mit Szenenauswahl
import { handleModelMessage } from './handlers/modelHandler.js';
import { handleUserMessage } from './handlers/userHandler.js';
import { getModelByTelegramId, getUserByTelegramId, supabase } from './utils/supabase.js';
import { uploadMedia } from './utils/media.js';
import { getNextMediaInSequence } from './utils/mediaSelector.js';

export function applyRouter(bot, model) {
  // /start Befehl - Szene auswählen
  bot.command('start', async (ctx) => {
    const { data: scenesRaw } = await supabase
      .from('media')
      .select('scene')
      .eq('model_id', model.id)
      .eq('auto_use', true)
      .neq('scene', '');

    const scenes = [...new Set(scenesRaw.map((s) => s.scene))];
    scenes.push('Standard');

    const keyboard = scenes.map((scene) => [{ text: scene, callback_data: `scene:${scene}` }]);
    await ctx.reply('💡 Wähle eine Szene für den Chat:', {
      reply_markup: { inline_keyboard: keyboard },
    });
  });

  // Szene setzen über Button
  bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery?.data;
    if (!data?.startsWith('scene:')) return;

    const scene = data.split(':')[1];
    const userId = ctx.from.id;

    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', userId)
      .single();

    if (existing) {
      await supabase.from('users').update({ current_scene: scene }).eq('telegram_id', userId);
    } else {
      await supabase.from('users').insert([{ telegram_id: userId, current_scene: scene }]);
    }

    await ctx.answerCbQuery(`Szene "${scene}" aktiviert.`);
    await ctx.reply(`🌀 Du bist jetzt in der Szene: *${scene}*`, { parse_mode: 'Markdown' });
  });

  // Szene zurücksetzen mit /restart
  bot.command('restart', async (ctx) => {
    const userId = ctx.from.id;
    await supabase.from('users').update({ current_scene: null }).eq('telegram_id', userId);
    await ctx.reply('🔁 Szene zurückgesetzt. Starte neu mit /start');
  });

  // Nachrichtenverarbeitung
  bot.on('message', async (ctx) => {
    const userId = ctx.message?.from?.id;
    if (!userId) return;

    const isModel = String(model?.telegram_id) === String(userId);
    const msgText = ctx.message?.text?.toLowerCase() || '';

    // Upload durch Model
    if (isModel && (ctx.message.photo || ctx.message.video)) {
      const file = ctx.message.photo?.at(-1) || ctx.message.video;
      const type = ctx.message.photo ? 'image' : 'video';

      await ctx.reply('⏳ Lade Medium hoch...');
      const result = await uploadMedia(file.file_id, type, model.id, ctx.telegram);

      if (result.success) {
        await ctx.reply(`✅ Hochgeladen! Pfad: ${result.file_url}`);
      } else {
        await ctx.reply('❌ Upload fehlgeschlagen.');
      }
      return;
    }

    // Nutzerbild explizit anfordern
    if (!isModel && msgText.includes('bild')) {
      const user = await getUserByTelegramId(userId);
      const scene = user?.current_scene || 'standard';
      const media = await getNextMediaInSequence(model.id, scene);

      if (!media?.signedUrl) return ctx.reply('📭 Kein Bild verfügbar.');
      await ctx.replyWithPhoto(media.signedUrl, { caption: media.caption || '📸' });
      return;
    }

    if (isModel) return await handleModelMessage(ctx, model);

    const user = await getUserByTelegramId(userId);
    if (user) return await handleUserMessage(ctx, user, model);

    await ctx.reply('👀 Du bist weder als Model noch als User bekannt.');
  });
}
