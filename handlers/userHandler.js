export async function handleUserMessage(ctx, user, model) {
  const message = ctx.message;

  // Einfacher Einstieg
  if (message.text?.toLowerCase() === '/start') {
    return ctx.reply(`Hey 😘 Willkommen bei *${model.bot_name || model.username}*!\nWas möchtest du heute erleben?`, {
      parse_mode: 'Markdown'
    });
  }

  // Default-Verhalten (kann erweitert werden)
  await ctx.reply('💬 Ich leite deine Nachricht weiter… Bald bekommst du eine heiße Antwort 😏');
}
