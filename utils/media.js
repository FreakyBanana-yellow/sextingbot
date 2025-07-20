import { supabase } from '../supabase/client.js';
import fetch from 'node-fetch'; // Nur nötig, falls Node < 18

/**
 * Lädt ein Telegram-Medium hoch, speichert Pfad in der Datenbank
 * @param {string} fileId - Telegram File ID
 * @param {string} type - 'image' | 'video' | 'audio' etc.
 * @param {string} modelId - UUID des Models
 * @param {object} telegram - Telegram API Instanz
 */
export async function uploadMedia(fileId, type, modelId, telegram) {
  try {
    // 1. Telegram-Datei abrufen
    const fileLink = await telegram.getFileLink(fileId);
    const res = await fetch(fileLink.href);

    if (!res.ok) {
      console.error('❌ Fehler beim Abrufen der Datei von Telegram:', res.statusText);
      return { success: false };
    }

    const buffer = await res.arrayBuffer();
    const mimeType = res.headers.get('content-type');
    const ext = mimeType?.split('/')[1] || 'bin';

    const filename = `${Date.now()}.${ext}`;
    const path = `${modelId}/${type}/${filename}`;

    // 2. Upload zu Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('model-media')
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Upload-Fehler:', uploadError);
      return { success: false };
    }

    // 3. Erstelle eine signierte URL (z. B. für Anzeige in Telegram)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('model-media')
      .createSignedUrl(path, 60 * 60 * 24); // 24h gültig

    if (signedError) {
      console.error('❌ Fehler bei Signed URL:', signedError);
      return { success: false };
    }

    // 4. Speicherpfad in der media-Tabelle sichern
    const { error: dbError } = await supabase
      .from('media')
      .insert([{
        model_id: modelId,
        type,
        url: signedData.signedUrl,      // Speichere direkt die URL
        file_url: path,                 // optional: roher Pfad zur Datei
        uploaded_at: new Date(),
        auto_use: true,
        used: false,
        scene: 'default',
        caption: null
      }]);

    if (dbError) {
      console.error('❌ Fehler beim Speichern in der DB:', dbError);
      return { success: false };
    }

    return {
      success: true,
      file_url: path,
      signed_url: signedData.signedUrl,
    };

  } catch (err) {
    console.error('❌ Unerwarteter Fehler:', err);
    return { success: false };
  }
}
