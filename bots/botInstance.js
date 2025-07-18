import { Telegraf } from 'telegraf';
import { router } from '../router.js';
import { getModelByBotToken } from '../utils/supabase.js';

export default async function startBot({ botToken }) {
  const bot = new Telegraf(botToken);

  const model = await getModelByBotToken(botToken);
  if (!model) {
    console.error(`❌ Kein Model gefunden für Token ${botToken}`);
    return;
  }

  console.log(`✅ Bot gestartet: ${model.name} (${model.bot_username})`);

  // /start explizit abfangen
  bot.start(async (ctx) => {
    const isModel = String(ctx.from.id) === model.telegram_id;
    if (isModel) {
      await ctx.reply(`Willkommen zurück, ${model.name} 😎`);
    } else {
      await ctx.reply(`Hey, ich bin ${model.name} 😘 Schreib mir, was du willst…`);
    }
  });

  // alle Nachrichten gehen durch Router
  bot.on('message', async (ctx) => {
    await router(ctx, model);
  });

  bot.launch();
}
