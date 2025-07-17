import { supabase } from '../supabase/client.js';
import { uploadMedia } from '../utils/media.js';

export default async function handleModelMessage(ctx, model) {
  const message = ctx.message;
  const state = {};

  // Step 1: Text mit Szene & Reihenfolge auslesen (wenn vorhanden)
  if (message.caption) {
    const lower = message.caption.toLowerCase();
    const sceneMatch = lower.match(/#scene:\s?([a-z0-9-_]+)/);
    const seqMatch = lower.match(/#sequence:\s?(\d+)/);

    if (sceneMatch) state.scene = sceneMatch[1];
    if (seqMatch) state.sequence = parseInt(seqMatch[1]);
  }

  // Step 2: Medien-Upload
  if (message.photo || message.voice || message.video) {
    const file = message.photo?.[message.photo.length - 1]
      || message.voice
      || message.video;

    const fileId = file.file_id;
    const fileType = message.voice ? 'audio' : message.video ? 'video' : 'image';

    const { success, publicUrl } = await uploadMedia(fileId, fileType, model.id, ctx.telegram);

    if (success) {
      await supabase.from('media').insert({
        model_id: model.id,
        type: fileType,
        url: publicUrl,
        caption: message.caption || null,
        scene: state.scene || 'default',
        sequence: state.sequence || 0
      });

      await ctx.reply(`✅ ${fileType} gespeichert.\nSzene: ${state.scene || 'default'}\nReihenfolge: ${state.sequence || 0}`);
    } else {
      await ctx.reply('❌ Upload fehlgeschlagen.');
    }
    return;
  }

  // Likes, Dislikes, Prompt wie gehabt...
  if (message.text?.startsWith('#likes:')) {
    const likes = message.text.replace('#likes:', '').split(',').map(x => x.trim());
    await supabase.from('models').update({ likes }).eq('id', model.id);
    await ctx.reply('✅ Vorlieben gespeichert.');
    return;
  }

  if (message.text?.startsWith('#dislikes:')) {
    const dislikes = message.text.replace('#dislikes:', '').split(',').map(x => x.trim());
    await supabase.from('models').update({ dislikes }).eq('id', model.id);
    await ctx.reply('✅ Tabus gespeichert.');
    return;
  }

  if (message.text?.startsWith('#prompt:')) {
    const prompt = message.text.replace('#prompt:', '').trim();
    await supabase.from('models').update({ persona_prompt: prompt }).eq('id', model.id);
    await ctx.reply('✅ GPT-Charakter aktualisiert.');
    return;
  }

  // Hilfe
  await ctx.reply(`Hi ${model.name} 😘\n\nDu kannst mir Inhalte schicken wie:
📸 *Medien* mit Beschreibung wie z. B.:
  • \`#scene: strip\`
  • \`#sequence: 2\`
  (→ Ich ziehe mein Shirt aus…)

💬 *Einstellungen:*
  • \`#likes: Küssen, Flüstern\`
  • \`#dislikes: Analsex\`
  • \`#prompt: Ich bin eine dominante Latina…\`
`, { parse_mode: 'Markdown' });
}
