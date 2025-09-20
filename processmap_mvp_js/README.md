# Automated BPMN Generator (JavaScript MVP)

This archive contains a minimal JavaScript MVP for an Automated BPMN Generator:
- Node/Express backend (backend/)
- React frontend using Parcel (frontend/)

## Prerequisites
- Node 18+
- npm
- OpenAI API key in env var: OPENAI_API_KEY

## Run the backend
```bash
cd backend
npm install
export OPENAI_API_KEY="sk-..."
node index.js
```
Backend runs on port 4000.

## Run the frontend
```bash
cd frontend
npm install
npm start
```
Frontend runs on http://localhost:3000 (dev server). The frontend expects the backend proxied at `/api`.

## Notes
- This is an MVP: metadata is in-memory; files stored under backend/storage.
- The OpenAI model is expected to return strict JSON per the fixed prompt in `backend/fixed_prompt.txt`.
- For production use, add persistence (Postgres/S3), auth, validation, retries, scanning, and layout improvements.
