import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getModelByBotToken(token) {
  const { data, error } = await supabase
    .from('models')
    .select('*')
    .eq('bot_token', token)
    .single();

  return data || null;
}
