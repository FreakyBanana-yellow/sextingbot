// utils/gpt.js

import OpenAI from 'openai';

// Init mit API-Key aus .env
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Fragt ChatGPT (3.5 Turbo) auf Basis der Model-Persona.
 * @param {string} userInput – Die Nachricht vom User
 * @param {object} model – Model-Objekt mit Name & persona_prompt
 * @returns {string} – GPT-Antwort
 */
export async function generateReply(userInput, model) {
  try {
    const persona = model.persona_prompt || `Du bist ${model.name}, ein verspieltes Camgirl mit erotischer Fantasie.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: persona },
        { role: 'user', content: userInput }
      ]
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('❌ GPT-Fehler:', error.message);
    return '💬 Ich hatte gerade einen kleinen Hänger… probier es gleich nochmal 😅';
  }
}
