import { generateReply } from '../utils/gpt.js';
import { supabase } from '../utils/supabase.js';

export async function handleUserMessage(ctx, user, model) {
  const userInput = ctx.message?.text;
  if (!userInput || !model) return;

  try {
    // Tipp-Indikator in Telegram anzeigen
    await ctx.sendChatAction('typing');

    const reply = await generateReply(userInput, model);
    await ctx.reply(reply);

    // Passendes Medium zur Szene nachsenden
    await sendMatchingMedia(ctx, model);
  } catch (err) {
    console.error('GPT-Fehler:', err.message);
    await ctx.reply('❌ Uuups, da ist was schiefgelaufen beim Nachdenken...');
  }
}

async function sendMatchingMedia(ctx, model) {
  try {
    const scene = model.last_scene || '';

    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('model_id', model.id)
      .ilike('scene', `%${scene}%`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return;

    const media = data[0];
    const fileUrl = `https://zpzigwfjfhogkzuvijzm.supabase.co/storage/v1/object/public/model-media/${media.path}`;

    switch (media.type) {
      case 'image':
        await ctx.replyWithPhoto({ url: fileUrl }, { caption: media.caption || '' });
        break;
      case 'video':
        await ctx.replyWithVideo({ url: fileUrl }, { caption: media.caption || '' });
        break;
      case 'voice':
        await ctx.replyWithVoice({ url: fileUrl });
        break;
    }

  } catch (err) {
    console.error('❌ Medienversand fehlgeschlagen:', err.message);
  }
}
