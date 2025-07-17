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

  if (error || !data?.length) return null;

  // Markiere als verwendet
  await supabase.from('media')
    .update({ used: true })
    .eq('id', data[0].id);

  return data[0];
}

// Optional: Alle Medien einer Szene zurücksetzen (z. B. wenn neuer User)
export async function resetScene(modelId, scene = 'default') {
  await supabase
    .from('media')
    .update({ used: false })
    .eq('model_id', modelId)
    .eq('scene', scene);
}
