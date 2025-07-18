import { generateReply } from '../utils/gpt.js';

export async function handleUserMessage(ctx, user, model) {
  const text = ctx.message?.text;
  if (!text) return;

  try {
    // ⌨️ Bot zeigt "schreibt..."
    await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

    // GPT-Antwort generieren
    const reply = await generateReply(user, text, model);

    // Antwort senden
    await ctx.reply(reply);
  } catch (err) {
    console.error('❌ GPT-Antwort fehlgeschlagen:', err);
    await ctx.reply('⚠️ Da ging was schief... Versuch’s gleich nochmal 😬');
  }
}
