import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('❌ Supabase-URL oder Key fehlt in den Umgebungsvariablen!');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
