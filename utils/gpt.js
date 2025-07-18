import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Fragt GPT mit dynamischer Persona aus DB.
 * @param {string} userInput – Die Nachricht vom User
 * @param {object} model – Das Model-Objekt aus der Datenbank
 * @returns {string} – GPT-Antwort
 */
export async function generateReply(userInput, model) {
  try {
    const {
      name = 'Luna',
      persona_prompt = '',
      likes = [],
      dislikes = [],
      last_scene = 'neutral'
    } = model;

    // Build System-Prompt dynamisch
    const systemPrompt = `
${persona_prompt || `Du bist ${name}, ein erotisches Model mit viel Fantasie.`}
👄 Szene: "${last_scene}"
💖 Vorlieben: ${likes.join(', ') || 'keine Angabe'}
🙅‍♀️ Abneigungen: ${dislikes.join(', ') || 'keine Angabe'}
Sprich immer sexy, offen und spielerisch. Verwende passende Sprache und Reaktionen. 
Wenn der Nutzer nach einem Bild fragt, kannst du ein gespeichertes Bild aus der Szene vorschlagen (aber du sendest es nicht selbst).
`.trim();

    // Anfrage an GPT
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ]
    });

    return completion.choices[0].message.content.trim();

  } catch (error) {
    console.error('❌ GPT-Fehler:', error.message);
    return '💬 Ups… da ging was schief. Versuch es gleich nochmal, bitte 😅';
  }
}
