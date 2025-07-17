import { Telegraf } from 'telegraf';
import handleUserMessage from '../handlers/userHandler.js';
import handleModelMessage from '../handlers/modelHandler.js';

export default function startBot(model) {
  const bot = new Telegraf(model.bot_token);

  bot.on('message', async (ctx) => {
    const senderId = ctx.from.id.toString();

    if (senderId === model.telegram_id) {
      await handleModelMessage(ctx, model);
    } else {
      await handleUserMessage(ctx, model);
    }
  });

  bot.launch();
  console.log(`✅ Bot gestartet: ${model.name} (${model.bot_username})`);
}
