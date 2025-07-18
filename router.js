import { handleModelMessage } from './handlers/modelHandler.js';
import { handleUserMessage } from './handlers/userHandler.js';
import { getModelByTelegramId, getUserByTelegramId } from './utils/supabase.js';

/**
 * Diese Funktion bindet alle Router-Funktionen an einen Bot
 */
export function applyRouter(bot, model) {
  // Eingehende Nachrichten
  bot.on('message', async (ctx) => {
    const userId = ctx.message?.from?.id;
    if (!userId) return;

    // Model?
    if (String(model?.telegram_id) === String(userId)) {
  return await handleModelMessage(ctx, model);
}

    // User?
    const user = await getUserByTelegramId(userId);
    if (user) {
      return await handleUserMessage(ctx, user, model);
    }

    await ctx.reply('👀 Du bist weder als Model noch als User bekannt.');
  });

  // Callback-Buttons (z. B. Medien löschen)
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
