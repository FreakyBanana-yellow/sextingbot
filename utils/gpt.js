import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

export async function askGPT(userInput, model) {
  const persona = model.persona_prompt || `Du bist ${model.name}, ein verspieltes Model…`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: persona },
      { role: 'user', content: userInput }
    ]
  });

  return completion.choices[0].message.content;
}
