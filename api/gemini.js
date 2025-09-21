// api/gemini.js
// Vercel-compatible CommonJS serverless function.
// Put this at /api/gemini.js

const fetch = require("node-fetch"); // node-fetch is available in many serverless envs; if not, Vercel has global fetch

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Missing or invalid 'prompt' in request body." });
    return;
  }

  // Helpful debug info returned to client (non-sensitive)
  const debug = {
    envHasSdk: null,
    envHasKey: !!process.env.GEMINI_API_KEY,
    envHasRestEndpoint: !!process.env.GEMINI_REST_ENDPOINT,
    nodeVersion: process.version,
  };

  // 1) Try dynamic import of the SDK if installed
  try {
    let GoogleGenAI;
    try {
      const sdk = await import("@google/genai");
      // some SDKs default export or named export variance — try both
      GoogleGenAI = sdk.GoogleGenAI || sdk.default || sdk;
      debug.envHasSdk = true;
    } catch (sdkImportErr) {
      debug.envHasSdk = false;
      // continue to fallback below
      console.error("SDK import failed:", sdkImportErr?.message || sdkImportErr);
      // don't throw here - we want to fall back to REST if possible
    }

    if (GoogleGenAI) {
      // initialize SDK client
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({
          error: "Server misconfigured: GEMINI_API_KEY missing for SDK attempt.",
          debug,
        });
        return;
      }

      // Some SDKs expect different constructors. Try common patterns:
      let client;
      try {
        client = new GoogleGenAI({ apiKey }); // prefer this
      } catch (e1) {
        try {
          client = GoogleGenAI({ apiKey });
        } catch (e2) {
          console.error("SDK client initialization failed:", e1?.message || e1, e2?.message || e2);
          // continue to fallback
          client = null;
        }
      }

      if (!client) {
        // SDK was present but couldn't initialize; fallthrough to REST fallback if configured
        console.error("SDK present but could not initialize client; will attempt REST fallback if configured.");
      } else {
        try {
          // Use a deterministic low-temperature generation; adjust model if you need to
          const model = process.env.GEMINI_SDK_MODEL || "gemini-2.5-flash";
          // SDK usage differs by release — using a generic call that many SDKs provide:
          const resp = await client.models.generateContent?.({
            model,
            contents: prompt,
            config: { temperature: 0.0, candidateCount: 1 },
          });

          // Try to safely get text from response
          const text = resp?.text ?? (resp?.candidates?.[0]?.content ?? null) ?? JSON.stringify(resp);

          // extract xml if present
          const xmlMatch =
            (text && text.match && (text.match(/```(?:xml)?\s*([\s\S]*?)```/i) ||
              text.match(/(<\?xml[\s\S]*<\/bpmn:definitions>)/i) ||
              text.match(/(<bpmn:definitions[\s\S]*<\/bpmn:definitions>)/i))) || null;
          const xml = xmlMatch ? xmlMatch[1].trim() : (typeof text === "string" ? text.trim() : null);

          res.json({ ok: true, backend: "sdk", xml, text, debug });
          return;
        } catch (sdkCallErr) {
          console.error("SDK generateContent error:", sdkCallErr);
          // continue to fallback to REST if available
          debug.sdkCallError = sdkCallErr?.message || String(sdkCallErr);
        }
      }
    }
  } catch (errUnexpected) {
    console.error("Unexpected SDK path error:", errUnexpected);
    debug.unexpected = String(errUnexpected?.message || errUnexpected);
    // continue to rest fallback
  }

  // 2) REST fallback — only if the user has configured GEMINI_REST_ENDPOINT and GEMINI_API_KEY
  const restEndpoint = process.env.GEMINI_REST_ENDPOINT; // e.g. "https://generativelanguage.googleapis.com/v1beta2/models/xxx:generate"
  const apiKey = process.env.GEMINI_API_KEY;

  if (!restEndpoint || !apiKey) {
    res.status(500).json({
      error: "No working Gemini SDK available and REST fallback not configured. Provide GEMINI_REST_ENDPOINT and GEMINI_API_KEY or install @google/genai.",
      debug,
    });
    return;
  }

  // Make REST call
  try {
    // Build REST body expected by your endpoint. Many Google endpoints expect a JSON structure; check the endpoint you use.
    // We'll send { prompt } as a simple payload — adjust to your endpoint's expected schema.
    const body = {
      prompt, // adjust if API expects different key
      // optional controls can be added here if your endpoint supports them
    };

    const resp = await fetch(restEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Many Google endpoints use Bearer token auth; some accept ?key= API key in URL instead
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      // timeout not available in node-fetch v2 here — environment controls runtime timeout
    });

    const status = resp.status;
    const text = await resp.text(); // parse raw response for debugging
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch (jsonErr) {
      // not JSON - keep raw text
    }

    // Try to extract xml from whatever was returned
    const rawString = typeof parsed === "string" ? parsed : (parsed?.outputText ?? parsed?.text ?? text);
    const xmlMatch =
      (rawString && rawString.match && (rawString.match(/```(?:xml)?\s*([\s\S]*?)```/i) ||
        rawString.match(/(<\?xml[\s\S]*<\/bpmn:definitions>)/i) ||
        rawString.match(/(<bpmn:definitions[\s\S]*<\/bpmn:definitions>)/i))) || null;
    const xml = xmlMatch ? xmlMatch[1].trim() : (typeof rawString === "string" ? rawString.trim() : null);

    if (!resp.ok) {
      console.error("REST fallback returned non-OK status", status, text);
      res.status(502).json({
        error: "Gemini REST endpoint returned non-OK status",
        status,
        bodyText: text,
        debug,
      });
      return;
    }

    res.json({
      ok: true,
      backend: "rest",
      status,
      body: parsed ?? text,
      xml,
      debug,
    });
    return;
  } catch (restErr) {
    console.error("REST fallback call failed:", restErr);
    res.status(500).json({
      error: "REST fallback call failed",
      details: String(restErr?.message || restErr),
      debug,
    });
    return;
  }
};
