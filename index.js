import { supabase } from './supabase/client.js';
import startBot from './bots/botInstance.js';

const { data: models, error } = await supabase
  .from('models')
  .select('*')
  .eq('status', true)
  .not('bot_token', 'is', null);

if (error) {
  console.error('❌ Fehler beim Laden der Models:', error);
  process.exit(1);
}

models.forEach((model) => startBot(model));
