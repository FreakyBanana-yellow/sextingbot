import { askGPT } from '../utils/gpt.js';
import { supabase } from '../supabase/client.js';
import { getNextMediaInSequence } from '../utils/mediaSelector.js';

export default async function handleUserMessage(ctx, model) {
  const userId = ctx.from.id.toString();
  const input = ctx.message.text;

  await supabase.from('users').upsert({
    telegram_id: userId,
    username: ctx.from.username,
    active_model_id: model.id,
    last_message: new Date().toISOString()
  });

  await supabase.from('conversations').insert({
    user_id: userId,
    model_id: model.id,
    from_user: true,
    message: input
  });

  const gptReply = await askGPT(input, model);
  await ctx.reply(gptReply);

  // Medien nur senden, wenn GPT inhaltlich passt
  if (gptReply.toLowerCase().includes('zieh') || gptReply.toLowerCase().includes('mehr sehen')) {
    const media = await getNextMediaInSequence(model.id, 'strip');
    if (media) {
      if (media.type === 'image') {
        await ctx.replyWithPhoto({ url: media.url }, { caption: media.caption || undefined });
      }
      if (media.type === 'video') {
        await ctx.replyWithVideo({ url: media.url }, { caption: media.caption || undefined });
      }
      if (media.type === 'audio') {
        await ctx.replyWithVoice({ url: media.url });
      }
    }
  }

  await supabase.from('conversations').insert({
    user_id: userId,
    model_id: model.id,
    from_user: false,
    message: gptReply
  });
}
