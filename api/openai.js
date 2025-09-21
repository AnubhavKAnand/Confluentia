/**
 * Vercel / Serverless function handler
 *
 * Endpoint: POST /api/openai
 * Body: { prompt: "..." }
 *
 * Environment variable needed: OPENAI_API_KEY
 *
 * This handler returns JSON:
 *  { text: "...", xml: "..." } (xml is the extracted XML if detected)
 */

const fetch = require("node-fetch");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { prompt } = req.body || {};
  if (!prompt) {
    res.status(400).json({ error: "Missing prompt in request body" });
    return;
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    res.status(500).json({ error: "Server misconfigured: missing OPENAI_API_KEY" });
    return;
  }

  try {
    // Using Chat Completions API
    const payload = {
      model: "gpt-4", // change to gpt-3.5-turbo if you don't have gpt-4 access
      messages: [
        { role: "system", content: "You are an expert BPMN process modeller. Produce correct BPMN 2.0 XML only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 3000
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error("OpenAI error", r.status, errText);
      res.status(500).json({ error: "OpenAI API error", details: errText });
      return;
    }

    const data = await r.json();

    const text = (data?.choices?.[0]?.message?.content) || "";

    // try to extract XML if included in a code block or raw xml
    const xmlMatch = text.match(/```(?:xml)?\s*([\s\S]*?)```/i) || text.match(/(<\?xml[\s\S]*<\/bpmn:definitions>)/i) || text.match(/(<bpmn:definitions[\s\S]*<\/bpmn:definitions>)/i);
    const xml = xmlMatch ? xmlMatch[1] : null;

    res.json({ text, xml });
  } catch (err) {
    console.error("Server error calling OpenAI:", err);
    res.status(500).json({ error: "Server error calling OpenAI", details: err.message });
  }
};
