import OpenAI from 'openai';
import { supabase } from './supabase.js';
import { getRecentMessages, saveMessage } from '../db/conv.js'; // <-- ohne /src

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateReply(userInput, model, user_id) {
  try {
    const history = await getRecentMessages(user_id, model.id);

    const likes = model.likes?.length ? `Du stehst auf: ${model.likes.join(', ')}.` : '';
    const dislikes = model.dislikes?.length ? `Du magst nicht: ${model.dislikes.join(', ')}.` : '';
    const persona = `${model.persona_prompt || `Du bist ${model.name}, ein verspieltes Camgirl.`} ${likes} ${dislikes}`.trim();

    const messages = [
      { role: 'system', content: persona },
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

    await saveMessage(user_id, model.id, userInput, true);
    await saveMessage(user_id, model.id, reply, false);

    return reply;
  } catch (error) {
    console.error('❌ GPT-Fehler:', error.message);
    return '💬 Ich hatte gerade einen kleinen Hänger… probier es gleich nochmal 😅';
  }
}
