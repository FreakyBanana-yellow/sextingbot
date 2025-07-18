// src/db/conversation.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Holt die letzten 6 Nachrichten für eine User-Model-Kombi.
 * @param {string} userId – Telegram-ID des Users
 * @param {string} modelId – UUID des Models
 */
export async function getConversationHistory(userId, modelId) {
  const { data, error } = await supabase
    .from('conversations')
    .select('role, content')
    .eq('user_id', userId)
    .eq('model_id', modelId)
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error('❌ Fehler beim Laden des Gesprächsverlaufs:', error.message);
    return [];
  }

  return data.reverse(); // Chronologische Reihenfolge
}
