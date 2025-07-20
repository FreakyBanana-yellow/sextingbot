import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('❌ Supabase-URL oder -Key fehlt! Bitte ENV-Variablen prüfen.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Holt ein Model anhand des Bot-Tokens
 */
export async function getModelByBotToken(botToken) {
  const { data, error } = await supabase
    .from('models')
    .select('*')
    .eq('bot_token', botToken)
    .single();

  if (error) {
    console.error('❌ Fehler bei getModelByBotToken:', error.message);
    return null;
  }

  return data;
}

/**
 * Holt ein Model anhand der Telegram-ID
 */
export async function getModelByTelegramId(telegramId) {
  const { data, error } = await supabase
    .from('models')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (error) {
    console.error('❌ Fehler bei getModelByTelegramId:', error.message);
    return null;
  }

  return data;
}

/**
 * Holt oder erstellt einen User anhand der Telegram-ID
 */
export async function getUserByTelegramId(telegramId) {
  if (!telegramId) {
    console.error('❌ Telegram ID fehlt.');
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('❌ Fehler beim Abrufen des Users:', error.message);
    return null;
  }

  // User existiert nicht → neu anlegen
  if (!data) {
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ telegram_id: telegramId }])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Fehler beim Anlegen des Users:', insertError.message);
      return null;
    }

    console.log('🆕 Neuer User angelegt:', newUser.id);
    return newUser;
  }

  return data;
}

/**
 * Aktualisiert die aktuelle Szene des Users
 */
export async function updateUserScene(userTelegramId, scene) {
  const { error } = await supabase
    .from('users')
    .update({ current_scene: scene })
    .eq('telegram_id', userTelegramId);

  if (error) {
    console.error('❌ Fehler beim Update der Szene:', error);
    throw error;
  }
}
