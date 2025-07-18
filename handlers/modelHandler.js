import { supabase } from '../utils/supabase.js';
import { randomUUID } from 'crypto';
import mime from 'mime-types';

const modelStates = new Map(); // Temporäre Szenen-/Meta-Daten

export async function handleModelMessage(ctx, model) {
  const chatId = ctx.message.chat.id;
  const message = ctx.message;
  const modelId = model.id;

  const file = message.photo?.at(-1) || message.video || message.voice || null;

  // === TEXTBASIERTE BEFEHLE ===
  if (message.text?.startsWith('/')) {
    const [cmd, ...args] = message.text.trim().split(' ');
    const value = args.join(' ').trim();
    const state = modelStates.get(chatId) || {};

    switch (cmd.toLowerCase()) {
      case '/szene':
        state.scene = value;
        await ctx.reply(`🎬 Szene gesetzt: *${value}*`, { parse_mode: 'Markdown' });
        break;
      case '/caption':
        state.caption = value;
        await ctx.reply(`🖊️ Caption gespeichert.`, { parse_mode: 'Markdown' });
        break;
      case '/reihenfolge':
        state.sequence = parseInt(value);
        await ctx.reply(`🔢 Reihenfolge: ${value}`);
        break;
      case '/auto_use':
        state.auto_use = value === 'true';
        await ctx.reply(`⚙️ Auto-Use ist jetzt: ${state.auto_use ? 'aktiviert' : 'deaktiviert'}`);
        break;
      case '/media':
        const { data, error } = await supabase
          .from('media')
          .select('*')
          .eq('model_id', modelId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error || !data.length) {
          await ctx.reply('⚠️ Keine Medien gefunden.');
          return;
        }

        for (const item of data) {
          const captionText = `🖼 *Typ:* ${item.type}
📝 *Caption:* ${item.caption || '–'}
🎬 *Szene:* ${item.scene || '–'}
🔁 *Auto-Use:* ${item.auto_use ? '✅' : '❌'}
🕒 *Erstellt:* ${new Date(item.created_at).toLocaleString('de-DE')}`;

          const buttons = {
            reply_markup: {
              inline_keyboard: [[
                { text: '🗑 Löschen', callback_data: `delete_${item.id}` }
              ]]
            },
            parse_mode: 'Markdown'
          };

          if (item.type === 'image') {
            await ctx.replyWithPhoto(item.url, { caption: captionText, ...buttons });
          } else if (item.type === 'video') {
            await ctx.replyWithVideo(item.url, { caption: captionText, ...buttons });
          } else if (item.type === 'voice') {
            await ctx.replyWithVoice(item.url, { caption: captionText, ...buttons });
          }
        }
        break;
      default:
        await ctx.reply('❓ Unbekannter Befehl.');
    }

    modelStates.set(chatId, state);
    return;
  }

  // === MEDIEN-UPLOAD ===
  if (!file) return ctx.reply('❗ Bitte sende ein Foto, Video oder eine Sprachnachricht.');

  const fileId = file.file_id;
  const fileLink = await ctx.telegram.getFileLink(fileId);
  const ext = mime.extension(file.mime_type || 'image/jpeg');
  const filename = `${randomUUID()}.${ext}`;
  const fileRes = await fetch(fileLink.href);
  const buffer = Buffer.from(await fileRes.arrayBuffer());

  const upload = await supabase.storage.from('model_media').upload(filename, buffer, {
    contentType: file.mime_type || 'image/jpeg',
    upsert: false
  });

  if (upload.error) {
    console.error(upload.error);
    return ctx.reply('❌ Upload fehlgeschlagen.');
  }

  const publicUrl = supabase.storage.from('model_media').getPublicUrl(filename).data.publicUrl;
  const meta = modelStates.get(chatId) || {};
  const { scene = null, caption = null, sequence = null, auto_use = false } = meta;

  await supabase.from('media').insert({
    model_id: modelId,
    type: message.photo ? 'image' : message.video ? 'video' : 'voice',
    url: publicUrl,
    caption,
    auto_use,
    created_at: new Date().toISOString(),
    scene,
    sequence,
    used: false
  });

  await ctx.reply('✅ Datei gespeichert!');
}
