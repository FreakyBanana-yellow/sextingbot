import { supabase } from '../supabase/client.js';
import fetch from 'node-fetch'; // Nur nötig, falls du Node < 18 nutzt

export async function uploadMedia(fileId, type, modelId, telegram) {
  try {
    const fileLink = await telegram.getFileLink(fileId);
    const res = await fetch(fileLink.href);
    const buffer = await res.arrayBuffer();

    const ext = res.headers.get('content-type')?.split('/')[1] || 'bin';
    const path = `${modelId}/${type}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('model-media')
      .upload(path, buffer, {
        contentType: res.headers.get('content-type'),
        upsert: false
      });

    if (uploadError) {
      console.error(uploadError);
      return { success: false };
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from('model-media')
      .createSignedUrl(path, 60 * 60 * 24); // 24h gültig

    if (signedError) {
      console.error(signedError);
      return { success: false };
    }

    return {
      success: true,
      publicUrl: signedData.signedUrl
    };

  } catch (err) {
    console.error(err);
    return { success: false };
  }
}
