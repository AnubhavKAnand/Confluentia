# SOP → BPMN Viewer (React + Serverless OpenAI)

## Overview
Upload documents (PDF, DOCX, XLSX/CSV), extract text client-side, send to OpenAI to produce BPMN XML, render in-browser using `bpmn-js`, and download XML or JSON export of the model.

## Quickstart (local)
1. `npm install`
2. Create a `.env` file or set environment variable `OPENAI_API_KEY` for the serverless function when deploying.
   - Locally, you can run a server that proxies or run using Vercel.
3. `npm start` (for CRA dev)
4. Open `http://localhost:3000`.

**Note:** The example `api/openai.js` is a Vercel-compatible serverless function. For local dev, you'll need a local server or use Vercel preview to test the function. Alternatively you can create a tiny express proxy to forward requests to OpenAI with your API key (not recommended for production).

## Deploy (Vercel recommended)
1. Push repo to GitHub.
2. On Vercel, import the repo and deploy.
3. In the Vercel project settings, set an Environment Variable:
   - `OPENAI_API_KEY` = your OpenAI API key
4. Deploy — Vercel will pick up the `api/openai.js` serverless function automatically.

## Deploy to GitHub Pages
GitHub Pages cannot host serverless endpoints. To use GitHub Pages:
- Host the frontend on GitHub Pages.
- Deploy the `api/openai.js` function somewhere else (Vercel / Netlify Functions / AWS Lambda) and update the frontend to call that function's URL. Keep the key secret in that provider.

## Security
**Do not** commit your OpenAI API key. Always use environment variables in your hosting platform.

## Notes & troubleshooting
- If OpenAI returns plain text instead of strict XML, the frontend tries to extract the XML inside code blocks.
- If the generated BPMN is invalid, you can edit the XML in the right-side editor and press the "Generate" button again (it will re-render).
