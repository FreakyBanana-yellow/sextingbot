import { generateReply } from '../utils/gpt.js';
import { supabase } from '../utils/supabase.js';

export async function handleUserMessage(ctx, model) {
  const chatId = ctx.message.chat.id;
  const username = ctx.message.from?.username || 'Unbekannt';
  const inputText = ctx.message.text;

  if (!inputText || inputText.startsWith('/')) return;

  try {
    // 🕒 Bot "schreibt..."-Indikator
    await ctx.sendChatAction('typing');

    // 🔥 GPT-Antwort erzeugen
    const reply = await generateReply(inputText, model);

    // 💬 Antwort senden
    await ctx.reply(reply);

    // 📊 Optional: Logging in Supabase
    await supabase.from('conversations').insert({
      model_id: model.id,
      user_id: chatId.toString(),
      username: username,
      input: inputText,
      output: reply,
      created_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Fehler im userHandler:', error.message);
    await ctx.reply('🥺 Da ist gerade was schiefgelaufen… versuch es bitte nochmal.');
  }
}
