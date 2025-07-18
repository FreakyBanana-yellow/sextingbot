// utils/gpt.js

import OpenAI from 'openai';
import { getConversationHistory } from '../db/conversation.js';
import { getMediaForModel } from '../db/media.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Dynamische GPT-Antwort mit Gesprächsverlauf, Persona & Medien.
 * @param {string} userInput – Die aktuelle Nachricht des Users
 * @param {object} model – Model-Datenbankobjekt (mit likes, dislikes etc.)
 * @param {string} userId – Telegram-User-ID zur Abfrage des bisherigen Verlaufs
 * @returns {string} – GPT-Antwort
 */
export async function generateReply(userInput, model, userId) {
  try {
    // Gesprächsverlauf abrufen (letzte 6 Nachrichten)
    const history = await getConversationHistory(userId, 6);

    // System-Prompt dynamisch aus DB-Werten
    const persona = model.persona_prompt || `Du bist ${model.name}, ein verspieltes Camgirl mit erotischer Fantasie.`;
    const likes = model.likes?.join(', ') || 'Dirty Talk';
    const dislikes = model.dislikes?.join(', ') || 'Respektlosigkeit';

    const systemPrompt = `${persona}
Deine Vorlieben: ${likes}.
Was du nicht magst: ${dislikes}.
Reagiere liebevoll, verspielt und erotisch – aber menschlich.`;

    // Nachrichtenverlauf aufbauen
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg) => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: userInput },
    ];

    // GPT-Antwort generieren
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
    });

    let reply = completion.choices[0].message.content.trim();

    // Bildauswahl (optional): Wenn gefragt wurde
    if (/(bild|foto|pic|zeigen).*\?/i.test(userInput)) {
      const media = await getMediaForModel(model.id);
      if (media && media.length > 0) {
        const randomMedia = media[Math.floor(Math.random() * media.length)];
        reply += `\n\n📸 <img src="${randomMedia.url}" alt="${randomMedia.caption}" />`;
      } else {
        reply += `\n\n⚠️ Ich habe leider noch keine Bilder hinterlegt.`;
      }
    }

    return reply;
  } catch (error) {
    console.error('❌ GPT-Fehler:', error.message);
    return '💬 Uuups... da ist mir was durchgerutscht. Versuch es nochmal 😉';
  }
}
