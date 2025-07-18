import { askGPT } from '../utils/gpt.js';

export async function handleUserMessage(ctx, model) {
  const chatId = ctx.message.chat.id;
  const text = ctx.message.text || '';

  // optional: Tipp-Indikator setzen
  await ctx.telegram.sendChatAction(chatId, 'typing');

  try {
    const gptResponse = await askGPT(text, model);

    await ctx.reply(gptResponse, {
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('GPT-Fehler:', error);
    await ctx.reply('Uuups 😅 Da lief was schief...');
  }
}
