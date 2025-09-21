export const processWithGemini = async (text) => {
    const systemPrompt = `
      You are an expert business analyst specializing in process modeling. Your task is to analyze the provided text from a Standard Operating Procedure (SOP) document and extract all business processes.
      For each process, you must:
      1. Identify the process name.
      2. Provide a high-level description.
      3. Generate a valid BPMN 2.0 XML representation of the process flow. The BPMN should be well-formed and include start events, end events, tasks, and gateways where appropriate.
      4. Identify all associated risks mentioned in the document for each process and categorize them.
      5. Identify all associated controls mentioned for each process and describe them.
  
      The final output must be a single JSON object adhering strictly to the provided schema. The 'process_map_bpmn_xml' field must contain a complete and valid BPMN XML string. Do not include any explanatory text outside of the JSON object.
    `;
  
    const jsonSchema = {
      "type": "OBJECT",
      "properties": {
          "found_processes": { "type": "BOOLEAN" },
          "process_count": { "type": "INTEGER" },
          "processes": {
              "type": "ARRAY",
              "items": {
                  "type": "OBJECT",
                  "properties": {
                      "process_name": { "type": "STRING" },
                      "process_description": { "type": "STRING" },
                      "process_map_bpmn_xml": { "type": "STRING" },
                      "risk_taxonomy": {
                          "type": "ARRAY",
                          "items": {
                              "type": "OBJECT",
                              "properties": {
                                  "category": { "type": "STRING" },
                                  "risk_name": { "type": "STRING" },
                                  "description": { "type": "STRING" }
                              },
                              "required": ["category", "risk_name", "description"]
                          }
                      },
                      "controls": {
                          "type": "ARRAY",
                          "items": {
                              "type": "OBJECT",
                              "properties": {
                                  "control_name": { "type": "STRING" },
                                  "control_type": { "type": "STRING" },
                                  "description": { "type": "STRING" }
                              },
                               "required": ["control_name", "control_type", "description"]
                          }
                      }
                  },
                  "required": ["process_name", "process_description", "process_map_bpmn_xml", "risk_taxonomy", "controls"]
              }
          }
      },
      "required": ["found_processes", "process_count", "processes"]
    };
  
    const apiKey = ""; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [{ parts: [{ text: `Document content: \n\n${text}` }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: jsonSchema
        }
    };
  
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
  
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API call failed with status ${response.status}: ${errorBody}`);
        }
  
        const result = await response.json();
        const candidate = result.candidates?.[0];
  
        if (candidate && candidate.content?.parts?.[0]?.text) {
             return JSON.parse(candidate.content.parts[0].text);
        } else {
             throw new Error('Invalid response structure from Gemini API.');
        }
    } catch (err) {
        console.error("Gemini API error:", err);
        throw new Error(`Failed to process document with AI. ${err.message}`);
    }
  };
  