import { handleModelMessage } from './handlers/modelHandler.js';
import { handleUserMessage } from './handlers/userHandler.js';
import { getModelByTelegramId, getUserByTelegramId } from './utils/supabase.js';
import { uploadMedia } from './utils/media.js';

/**
 * Diese Funktion bindet alle Router-Funktionen an einen Bot
 */
export function applyRouter(bot, model) {
  // Eingehende Textnachrichten & Medien
  bot.on('message', async (ctx) => {
    const userId = ctx.message?.from?.id;
    if (!userId) return;

    const isModel = String(model?.telegram_id) === String(userId);

    // === 📸 Upload-Funktion für Models ===
    if (isModel && (ctx.message.photo || ctx.message.video)) {
      const file = ctx.message.photo?.at(-1) || ctx.message.video;
      const type = ctx.message.photo ? 'image' : 'video';

      await ctx.reply('⏳ Lade Medium hoch...');

      const result = await uploadMedia(file.file_id, type, model.id, ctx.telegram);

      if (result.success) {
        await ctx.reply(`✅ Hochgeladen! Bereit zur Nutzung.\nPfad: ${result.file_url}`);
      } else {
        await ctx.reply('❌ Upload fehlgeschlagen. Bitte versuch es später erneut.');
      }

      return;
    }

    // === Model (Textnachricht, z. B. Anweisung) ===
    if (isModel) {
      return await handleModelMessage(ctx, model);
    }

    // === User ===
    const user = await getUserByTelegramId(userId);
    if (user) {
      return await handleUserMessage(ctx, user, model);
    }

    await ctx.reply('👀 Du bist weder als Model noch als User bekannt.');
  });

  // === /upload explizit aufrufbar ===
  bot.command('upload', async (ctx) => {
    const userId = ctx.message?.from?.id;
    if (String(model?.telegram_id) !== String(userId)) {
      return ctx.reply('⛔ Nur das Model darf Medien hochladen.');
    }

    return ctx.reply('📸 Bitte sende mir jetzt ein Foto oder Video, das du hochladen möchtest.');
  });

  // === Callback-Buttons (z. B. Medien löschen) ===
  bot.on('callback_query', async (ctx) => {
    const userId = ctx.callbackQuery?.from?.id;
    if (!userId) return;

    const callbackData = ctx.callbackQuery?.data;

    // Nur Models dürfen Medien löschen
    if (model?.telegram_id === userId && callbackData?.startsWith('delete_')) {
      const mediaId = callbackData.replace('delete_', '');

      const { error } = await model.supabase
        .from('media')
        .delete()
        .eq('id', mediaId)
        .eq('model_id', model.id);

      if (error) {
        await ctx.answerCbQuery('❌ Fehler beim Löschen.');
      } else {
        await ctx.answerCbQuery('✅ Gelöscht!');
        await ctx.deleteMessage().catch(() => {});
      }
    } else {
      await ctx.answerCbQuery('⛔ Keine Berechtigung oder ungültige Aktion.');
    }
  });
}
