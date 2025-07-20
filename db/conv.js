import { supabase } from '../utils/supabase.js';

/**
 * Holt die letzten N Nachrichten zwischen User & Model
 */
export async function getRecentMessages(user_id, model_id, limit = 10) {
  if (!user_id || !model_id) {
    console.error('❌ Ungültige IDs für Chatverlauf:', { user_id, model_id });
    return [];
  }

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

/**
 * Speichert eine neue Chatnachricht
 */
export async function saveMessage(user_id, model_id, message, from_user = true) {
  if (!user_id || !model_id) {
    console.error('❌ user_id oder model_id ist undefined. Nachricht wird nicht gespeichert.');
    return;
  }

  const { error } = await supabase
    .from('conversations')
    .insert({
      user_id,
      model_id,
      message,
      from_user,
      created_at: new Date(),
    });

  if (error) {
    console.error('❌ Fehler beim Speichern der Nachricht:', error.message);
  }
}
