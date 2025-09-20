import axios from 'axios';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export async function callOpenAI(systemPrompt, extractedText) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY environment variable not set');

  // combine prompt and extracted text - send as two messages: system + user
  const body = {
    model: 'gpt-4',
    temperature: 0.0,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `DOCUMENT_START\n${extractedText}\nDOCUMENT_END\n\nReturn only JSON.` }
    ],
    max_tokens: 2000
  };

  const resp = await axios.post(OPENAI_URL, body, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 120000
  });

  // pick first choice content
  const content = resp.data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('no content from OpenAI: ' + JSON.stringify(resp.data));
  // Some models wrap JSON inside markdown fences — attempt to strip code fences
  const cleaned = content.replace(/^\s*```(?:json)?\s*/, '').replace(/\s*```\s*$/, '').trim();
  return cleaned;
}
