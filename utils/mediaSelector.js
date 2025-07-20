import { supabase } from '../supabase/client.js';

/**
 * Holt das nächste ungenutzte Medium in der Reihenfolge für eine Szene
 * und erzeugt eine gültige signed URL.
 */
export async function getNextMediaInSequence(modelId, scene = 'default') {
  if (!modelId) {
    console.error('❌ modelId fehlt bei getNextMediaInSequence');
    return null;
  }

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

  if (!data || data.length === 0) {
    console.warn(`⚠️ Keine Medien mehr in Szene "${scene}" verfügbar.`);
    return null;
  }

  const media = data[0];

  // Signed URL erzeugen
  const { data: signed, error: urlError } = await supabase.storage
    .from('model-media')
    .createSignedUrl(media.file_url, 60 * 60 * 24); // 24h

  if (urlError || !signed?.signedUrl) {
    console.error('❌ Fehler bei createSignedUrl:', urlError);
    return null;
  }

  // Markiere Medium als verwendet
  const { error: updateError } = await supabase
    .from('media')
    .update({ used: true })
    .eq('id', media.id);

  if (updateError) {
    console.error('⚠️ Medium konnte nicht als verwendet markiert werden:', updateError);
  }

  return {
    ...media,
    signedUrl: signed.signedUrl,
  };
}

/**
 * Setzt alle Medien einer Szene auf 'nicht verwendet'
 */
export async function resetScene(modelId, scene = 'default') {
  if (!modelId) {
    console.error('❌ modelId fehlt bei resetScene');
    return;
  }

  const { error } = await supabase
    .from('media')
    .update({ used: false })
    .eq('model_id', modelId)
    .eq('scene', scene);

  if (error) {
    console.error('❌ Fehler beim Zurücksetzen der Szene:', error);
  } else {
    console.log(`🔄 Szene "${scene}" für Model ${modelId} wurde zurückgesetzt.`);
  }
}
