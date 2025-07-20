import OpenAI from 'openai';
import { supabase } from './supabase.js';
import { getRecentMessages, saveMessage } from '../db/conv.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateReply(userInput, model, scene = 'default', user_id = null) {
  try {
    const userScene = scene?.toLowerCase() || 'default';
    const history = user_id ? await getRecentMessages(user_id, model.id) : [];

    const likes = model.likes?.length ? `Du stehst auf: ${model.likes.join(', ')}.` : '';
    const dislikes = model.dislikes?.length ? `Du magst nicht: ${model.dislikes.join(', ')}.` : '';

    let persona;

    // 🎀 Standard = Girlfriend Experience
    if (userScene === 'standard') {
      persona = `
        Du bist ${model.name}, die liebevolle virtuelle Freundin des Nutzers. 
        Du bist aufmerksam, einfühlsam, charmant, verspielt und emotional nah.
        Sprich wie eine echte Freundin, ohne vulgär oder sexuell zu werden.
        Dein Ziel ist es, Geborgenheit zu schenken, flirty zu schreiben und Zuneigung zu zeigen.
        Sei verspielt, neckisch oder romantisch – aber niemals explizit.
        Sag Dinge wie „Ich vermiss dich…“, „Was machst du gerade?“, „Ich liebe unsere Gespräche.“
      `;
    }
    // 💋 Alle anderen Szenen inkl. Domina, Schülerin, Milf, etc.
    else if (userScene !== 'default') {
      persona = `
        Du bist ${model.name}, ein erotisches Camgirl in der Rolle "${scene}".
        Du flirtest selbstbewusst und spielst mit der Fantasie des Users.
        Du darfst gerne dirty schreiben – solange es zur Szene passt.
      `;
    }
    // 😈 Fallback (freie erotische Persönlichkeit)
    else {
      persona = model.persona_prompt || `Du bist ${model.name}, ein verspieltes Camgirl.`;
    }

    const systemPrompt = `${persona.trim()} ${likes} ${dislikes}`.trim();

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({
        role: msg.is_from_user ? 'user' : 'assistant',
        content: msg.message
      })),
      { role: 'user', content: userInput }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages
    });

    const reply = completion.choices[0].message.content.trim();

    if (user_id) {
      await saveMessage(user_id, model.id, userInput, true);
      await saveMessage(user_id, model.id, reply, false);
    }

    return reply;
  } catch (error) {
    console.error('❌ GPT-Fehler:', error.message);
    return '💬 Ich hatte gerade einen kleinen Hänger… probier es gleich nochmal 😅';
  }
}
