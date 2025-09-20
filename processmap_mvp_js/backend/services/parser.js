import fs from 'fs';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import XLSX from 'xlsx';
import path from 'path';

export async function parseDocument(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') {
    const data = fs.readFileSync(filePath);
    const out = await pdf(data);
    return out.text;
  }
  if (ext === '.docx' || ext === '.doc') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
    const wb = XLSX.readFile(filePath);
    let text = '';
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      for (const row of rows) text += row.join('\t') + '\n';
    }
    return text;
  }
  // fallback: read as utf8 text
  return fs.readFileSync(filePath, 'utf8');
}
