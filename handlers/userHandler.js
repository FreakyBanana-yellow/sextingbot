import { generateReply } from '../utils/gpt.js';
import { supabase } from '../utils/supabase.js';
import { saveMessage } from '../db/conv.js';
import { getNextMediaInSequence } from '../utils/mediaSelector.js';

export async function handleUserMessage(ctx, user, model) {
  const userInput = ctx.message?.text;
  if (!userInput || !model) return;

  const userId = user?.id;

  try {
    await ctx.sendChatAction('typing');

    // Speichere Nutzereingabe
    await saveMessage(userId, model.id, userInput, true);

    // Sonderfall: Bild direkt anfordern
    if (userInput.toLowerCase().includes('bild')) {
      const media = await getNextMediaInSequence(model.id, 'default');

      if (media?.signedUrl) {
        await ctx.replyWithPhoto({ url: media.signedUrl }, {
          caption: media.caption || '📸 Für dich 💋'
        });
        await saveMessage(userId, model.id, '[Bild gesendet]', false);
      } else {
        await ctx.reply('📭 Leider kein Bild mehr verfügbar…');
      }
      return;
    }

    // GPT-Antwort generieren
    const reply = await generateReply(userInput, model);
    await ctx.reply(reply);
    await saveMessage(userId, model.id, reply, false);

    // Passendes Medium zur Szene senden
    await sendMatchingMedia(ctx, model, userId);

  } catch (err) {
    console.error('❌ GPT-Fehler:', err.message);
    await ctx.reply('❌ Da ging was schief beim Nachdenken...');
  }
}

async function sendMatchingMedia(ctx, model, userId) {
  try {
    const scene = model.last_scene || 'default';

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

    // Signed URL erzeugen
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

    // Als verwendet markieren & speichern
    await supabase.from('media').update({ used: true }).eq('id', media.id);
    await saveMessage(userId, model.id, `[${media.type} gesendet]`, false);

  } catch (err) {
    console.error('❌ Medienversand fehlgeschlagen:', err.message);
  }
}
