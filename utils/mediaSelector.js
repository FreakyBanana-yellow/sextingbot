import { supabase } from '../supabase/client.js';

export async function getNextMediaInSequence(modelId, scene = 'default') {
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .eq('model_id', modelId)
    .eq('scene', scene)
    .eq('auto_use', true)
    .eq('used', false)
    .order('sequence', { ascending: true })
    .limit(1);

  if (error) {
    console.error('❌ Fehler beim Abrufen von Medien:', error);
    return null;
  }

  if (!data?.length) {
    console.warn('⚠️ Keine weiteren Medien in dieser Szene verfügbar.');
    return null;
  }

  const media = data[0];

  // Signed URL erzeugen
  const { data: signed, error: urlError } = await supabase.storage
    .from('model-media')
    .createSignedUrl(media.file_url, 60 * 60 * 24); // 24h gültig

  if (urlError || !signed?.signedUrl) {
    console.error('❌ Fehler beim Erzeugen der signed URL:', urlError);
    return null;
  }

  // Als verwendet markieren
  await supabase
    .from('media')
    .update({ used: true })
    .eq('id', media.id);

  return {
    ...media,
    signedUrl: signed.signedUrl,
  };
}

// Szene zurücksetzen
export async function resetScene(modelId, scene = 'default') {
  const { error } = await supabase
    .from('media')
    .update({ used: false })
    .eq('model_id', modelId)
    .eq('scene', scene);

  if (error) {
    console.error('❌ Fehler beim Zurücksetzen der Szene:', error);
  }
}
