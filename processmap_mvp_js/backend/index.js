import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseDocument } from './services/parser.js';
import { callOpenAI } from './services/openaiService.js';
import { generateBpmnXml } from './services/bpmnService.js';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE = path.join(__dirname, 'storage');
fs.mkdirSync(STORAGE, { recursive: true });

const app = express();
app.use(express.json());

// Simple in-memory DB for MVP
const db = {}; // id -> { id, filename, status, createdAt, updatedAt, files: {raw, json, bpmnFiles: []} }

// Multipart handling: use formidable for robust parsing
import formidable from 'formidable';

app.post('/api/process/upload', (req, res) => {
  const form = new formidable.IncomingForm({ multiples: false, uploadDir: STORAGE, keepExtensions: true });
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('upload error', err);
      return res.status(500).json({ error: 'upload failed' });
    }
    const file = files.file;
    if (!file) return res.status(400).json({ error: 'no file uploaded (field name must be `file`)' });

    const id = uuidv4();
    const dir = path.join(STORAGE, id);
    fs.mkdirSync(dir, { recursive: true });
    const targetPath = path.join(dir, file.originalFilename || file.newFilename || file.name || 'uploaded_file');
    fs.renameSync(file.filepath || file.path, targetPath);

    db[id] = {
      id, filename: path.basename(targetPath), status: 'PENDING', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), files: {}
    };

    // respond immediately
    res.status(202).json({ processId: id, status: 'PENDING' });

    // background processing (fire & forget)
    setImmediate(async () => {
      try {
        db[id].status = 'PROCESSING'; db[id].updatedAt = new Date().toISOString();
        // 1) extract text
        const text = await parseDocument(targetPath);
        fs.writeFileSync(path.join(dir, 'raw.txt'), text, 'utf8');
        db[id].files.raw = 'raw.txt';

        // 2) call OpenAI with fixed prompt
        const prompt = fs.readFileSync(path.join(__dirname, 'fixed_prompt.txt'), 'utf8');
        const modelResponse = await callOpenAI(prompt, text);
        // modelResponse expected to be JSON text
        const parsed = JSON.parse(modelResponse); // will throw if not valid JSON
        const jsonPath = path.join(dir, 'output.json');
        fs.writeFileSync(jsonPath, JSON.stringify(parsed, null, 2), 'utf8');
        db[id].files.json = 'output.json';

        // 3) generate BPMN per process
        db[id].files.bpmn = [];
        for (const proc of parsed) {
          const pnameRaw = proc.processName || 'process';
          const pname = (pnameRaw || 'process').replace(/[^\\w\\-\\.]/g, '_').slice(0, 80);
          const steps = (proc.steps || []).map(s => s.text || s);
          const bpmnXml = generateBpmnXml(proc.processName || pname, steps);
          const fname = `${pname}.bpmn`;
          fs.writeFileSync(path.join(dir, fname), bpmnXml, 'utf8');
          db[id].files.bpmn.push(fname);
        }

        db[id].status = 'DONE'; db[id].updatedAt = new Date().toISOString();
        console.log('processed', id);
      } catch (e) {
        console.error('processing failed for', id, e);
        db[id].status = 'ERROR'; db[id].updatedAt = new Date().toISOString();
        db[id].error = (e && e.message) || String(e);
      }
    });
  });
});

app.get('/api/process/:id/status', (req, res) => {
  const id = req.params.id;
  const entry = db[id];
  if (!entry) return res.status(404).json({ error: 'not found' });
  res.json({ id, status: entry.status, createdAt: entry.createdAt, updatedAt: entry.updatedAt, error: entry.error || null });
});

app.get('/api/process/:id/json', (req, res) => {
  const id = req.params.id;
  const entry = db[id];
  if (!entry) return res.status(404).json({ error: 'not found' });
  if (!entry.files.json) return res.status(404).json({ error: 'json not ready' });
  res.sendFile(path.join(STORAGE, id, entry.files.json));
});

app.get('/api/process/:id/diagram', (req, res) => {
  const id = req.params.id;
  const entry = db[id];
  if (!entry) return res.status(404).json({ error: 'not found' });
  const name = req.query.name;
  let fname = null;
  if (name) {
    if (entry.files.bpmn.includes(name)) fname = name;
  } else {
    fname = entry.files.bpmn && entry.files.bpmn[0];
  }
  if (!fname) return res.status(404).json({ error: 'bpmn not found' });
  res.sendFile(path.join(STORAGE, id, fname));
});

// Admin list
app.get('/api/admin/list', (req, res) => {
  const arr = Object.values(db).map(e => ({ id: e.id, filename: e.filename, status: e.status, createdAt: e.createdAt, updatedAt: e.updatedAt }));
  res.json(arr);
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Backend running on http://localhost:${port}`));
