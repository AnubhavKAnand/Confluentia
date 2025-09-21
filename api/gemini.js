// api/gemini.js
// Vercel serverless function - proxy to Gemini via @google/genai
module.exports = async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed, use POST" });
      return;
    }
  
    const { prompt } = req.body || {};
    if (!prompt) {
      res.status(400).json({ error: "Missing prompt in request body" });
      return;
    }
  
    try {
      // dynamic import so this file can stay CommonJS
      const { GoogleGenAI } = await import("@google/genai");
  
      // pick your key from env - set GEMINI_API_KEY in Vercel (do NOT commit)
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
      if (!GEMINI_API_KEY) {
        res.status(500).json({ error: "Server misconfigured: missing GEMINI_API_KEY" });
        return;
      }
  
      // initialize client with API key (Gemini Developer API)
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
      // model choice: change to the model you prefer (gemini-2.5-flash, gemini-2.0-flash-001, etc.)
      const model = "gemini-2.5-flash"; // update if needed
  
      // Send the prompt
      const response = await ai.models.generateContent({
        model,
        // The SDK accepts `contents` as a string or array — we'll pass the prompt directly.
        contents: prompt,
        // low temperature for deterministic structure
        config: {
          temperature: 0.0,
          candidateCount: 1
        },
      });
  
      // Response object: response.text is the generated string (per SDK docs)
      const text = response?.text ?? "";
  
      // Try to extract XML inside triple backticks or raw <bpmn:definitions>..</bpmn:definitions>
      const xmlMatch =
        text.match(/```(?:xml)?\s*([\s\S]*?)```/i) ||
        text.match(/(<\?xml[\s\S]*<\/bpmn:definitions>)/i) ||
        text.match(/(<bpmn:definitions[\s\S]*<\/bpmn:definitions>)/i);
  
      const xml = xmlMatch ? xmlMatch[1].trim() : (text.trim() || null);
  
      res.json({ text, xml });
    } catch (err) {
      console.error("Gemini call failed:", err);
      // Provide the SDK error info but avoid leaking secrets
      res.status(500).json({ error: "Gemini API call failed", details: err?.message || String(err) });
    }
  };
  