import { generateReply } from '../utils/gpt.js';
import { supabase } from '../utils/supabase.js';
import { saveMessage } from '../db/conv.js';
import { getNextMediaInSequence } from '../utils/mediaSelector.js';

/**
 * Verarbeitet Nutzereingaben und generiert GPT-Antworten inkl. Szenenlogik
 */
export async function handleUserMessage(ctx, user, model) {
  const userInput = ctx.message?.text;
  const userId = user?.id;

  if (!userInput || !model || !userId) return;

  try {
    await ctx.sendChatAction('typing');

    const currentScene = user.current_scene || 'standard';


    // Eingabe speichern
    await saveMessage(userId, model.id, userInput, true);

    // Antwort generieren
    const reply = await generateReply(userInput, model, currentScene, userId);
    await ctx.reply(reply);
    await saveMessage(userId, model.id, reply, false);

    // Medien nur senden, wenn Szene ≠ "Standard"
    if (currentScene.toLowerCase() !== 'standard') {
      await sendMatchingMedia(ctx, model, userId, currentScene);
    }

  } catch (err) {
    console.error('❌ Fehler in handleUserMessage:', err.message);
    await ctx.reply('😵‍💫 Irgendwas lief gerade schief. Versuchs gleich nochmal!');
  }
}

/**
 * Holt und sendet ein passendes Medium für die Szene
 */
async function sendMatchingMedia(ctx, model, userId, scene = 'default') {
  try {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('model_id', model.id)
      .eq('scene', scene)
      .eq('auto_use', true)
      .eq('used', false)
      .order('sequence', { ascending: true })
      .limit(1);

    if (error || !data || data.length === 0) return;

    const media = data[0];

    const { data: signed, error: signedError } = await supabase.storage
      .from('model-media')
      .createSignedUrl(media.file_url, 60 * 60 * 24);

    if (signedError || !signed?.signedUrl) {
      console.error('❌ Fehler bei Signed URL:', signedError);
      return;
    }

    const url = signed.signedUrl;

    switch (media.type) {
      case 'image':
        await ctx.replyWithPhoto({ url }, { caption: media.caption || '' });
        break;
      case 'video':
        await ctx.replyWithVideo({ url }, { caption: media.caption || '' });
        break;
      case 'voice':
        await ctx.replyWithVoice({ url });
        break;
    }

    await supabase.from('media').update({ used: true }).eq('id', media.id);
    await saveMessage(userId, model.id, `[${media.type} gesendet]`, false);

  } catch (err) {
    console.error('❌ Fehler beim Medienversand:', err.message);
  }
}
