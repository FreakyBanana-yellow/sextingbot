// src/handlers/modelHandler.js

import { supabase } from '../utils/supabase.js';
import { createReadStream } from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';
import mime from 'mime-types';

const modelStates = new Map(); // temporäre Infos zwischenspeichern (Szene, Caption etc.)

export async function handleModelMessage(ctx, model) {
  const chatId = ctx.message.chat.id;
  const message = ctx.message;
  const modelId = model.id;

  // Befehle zum Setzen von Metadaten
  if (message.text && message.text.startsWith('/')) {
    const parts = message.text.split(' ');
    const command = parts[0].toLowerCase();
    const value = parts.slice(1).join(' ');

    const state = modelStates.get(chatId) || {};

    switch (command) {
      case '/szene':
        state.scene = value;
        await ctx.reply(`Szene gesetzt auf: ${value}`);
        break;
      case '/caption':
        state.caption = value;
        await ctx.reply(`Caption gesetzt auf: ${value}`);
        break;
      case '/reihenfolge':
        state.sequence = parseInt(value);
        await ctx.reply(`Reihenfolge gesetzt auf: ${value}`);
        break;
      case '/auto_use':
        state.auto_use = value === 'true';
        await ctx.reply(`Auto-Use ist jetzt: ${value}`);
        break;
      default:
        await ctx.reply('Unbekannter Befehl.');
    }

    modelStates.set(chatId, state);
    return;
  }

  // Medienupload
  const file = message.photo?.at(-1) || message.video || message.voice || null;
  if (!file) return ctx.reply('Bitte sende ein Foto, Video oder eine Sprachnachricht.');

  const fileId = file.file_id;
  const fileLink = await ctx.telegram.getFileLink(fileId);
  const ext = mime.extension(file.mime_type || 'image/jpeg');
  const filename = `${randomUUID()}.${ext}`;
  const fileRes = await fetch(fileLink.href);
  const arrayBuffer = await fileRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const upload = await supabase.storage.from('model_media').upload(filename, buffer, {
    contentType: file.mime_type || 'image/jpeg',
    upsert: false
  });

  if (upload.error) {
    console.error(upload.error);
    return ctx.reply('Fehler beim Upload');
  }

  const url = supabase.storage.from('model_media').getPublicUrl(filename).data.publicUrl;

  const meta = modelStates.get(chatId) || {};
  const { scene = null, caption = null, sequence = null, auto_use = false } = meta;

  await supabase.from('media').insert({
    model_id: modelId,
    type: message.photo ? 'image' : message.video ? 'video' : 'voice',
    url,
    caption,
    auto_use,
    created_at: new Date().toISOString(),
    scene,
    sequence,
    used: false
  });

  await ctx.reply('✅ Datei erfolgreich gespeichert.');
}
