import { handleUserMessage } from './handlers/userHandler.js';
import { handleModelMessage } from './handlers/modelHandler.js';

export async function router(ctx, model) {
  const telegramId = String(ctx.from.id);

  if (telegramId === model.telegram_id) {
    return handleModelMessage(ctx, model);
  } else {
    return handleUserMessage(ctx, model);
  }
}
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data.startsWith('delete_')) {
    const mediaId = data.replace('delete_', '');

    const { error } = await supabase.from('media').delete().eq('id', mediaId);

    if (error) {
      await ctx.answerCbQuery('❌ Fehler beim Löschen');
    } else {
      await ctx.editMessageCaption({ caption: '🗑️ Gelöscht.', parse_mode: 'Markdown' });
      await ctx.answerCbQuery('✅ Erfolgreich gelöscht');
    }
  }
});
