import { supabase } from './supabase.js';

export async function getRecentMessages(user_id, model_id, limit = 10) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', user_id)
    .eq('model_id', model_id)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('❌ Fehler beim Laden des Chatverlaufs:', error.message);
    return [];
  }

  return data;
}

export async function saveMessage(user_id, model_id, message, is_from_user = true) {
  const { error } = await supabase.from('conversations').insert({
    user_id,
    model_id,
    message,
    is_from_user
  });

  if (error) {
    console.error('❌ Fehler beim Speichern der Nachricht:', error.message);
  }
}
