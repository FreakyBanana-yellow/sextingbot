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

  if (error) return null;
  return data;
}

/**
 * Holt einen User anhand der Telegram-ID
 */
export async function getUserByTelegramId(telegramId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (error) return null;
  return data;
}
