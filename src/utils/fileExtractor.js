import { pdfjs } from 'react-pdf';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const extractTextFromPdf = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const pdf = await pdfjs.getDocument({ data: event.target.result }).promise;
        let textContent = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          textContent += text.items.map(s => s.str).join(' ') + '\n';
        }
        resolve(textContent);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

const extractTextFromDocx = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      mammoth.extractRawText({ arrayBuffer: event.target.result })
        .then(result => resolve(result.value))
        .catch(reject);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

const extractTextFromXlsx = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        let fullText = '';
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          fullText += jsonData.map(row => row.join(' ')).join('\n') + '\n';
        });
        resolve(fullText);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
};

export const extractTextFromFile = async (file) => {
  if (file.type === 'application/pdf') {
    return await extractTextFromPdf(file);
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return await extractTextFromDocx(file);
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel') {
    return await extractTextFromXlsx(file);
  } else {
    throw new Error('Unsupported file type. Please upload PDF, DOCX, or XLSX.');
  }
};
