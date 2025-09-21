// src/components/FileUploader.js
import React from "react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function FileUploader({ onTextExtracted }) {
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.toLowerCase();

    try {
      if (file.type === "application/pdf" || name.endsWith(".pdf")) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((t) => t.str).join(" ");
          fullText += pageText + "\n\n";
        }
        onTextExtracted(fullText.trim(), file.name);
      } else if (name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const arrayBuffer = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer });
        onTextExtracted(value.trim(), file.name);
      } else if (name.endsWith(".xlsx") || name.endsWith(".xls") || file.type.includes("spreadsheet")) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        let merged = "";
        workbook.SheetNames.forEach((sheetName) => {
          const ws = workbook.Sheets[sheetName];
          const csv = XLSX.utils.sheet_to_csv(ws);
          merged += `--- Sheet: ${sheetName} ---\n`;
          merged += csv + "\n\n";
        });
        onTextExtracted(merged.trim(), file.name);
      } else if (name.endsWith(".csv") || file.type === "text/csv") {
        const text = await file.text();
        onTextExtracted(text, file.name);
      } else {
        // fallback read as text
        try {
          const text = await file.text();
          onTextExtracted(text, file.name);
        } catch (err) {
          alert("Unsupported file type. Supported: PDF, DOCX, XLSX, CSV, TXT");
        }
      }
    } catch (err) {
      console.error("File parsing error:", err);
      alert("Failed to parse file. Check console for details.");
    }
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <label style={{ cursor: "pointer", padding: "6px 10px", background: "#eef2f7", borderRadius: 8 }}>
        <input type="file" accept=".pdf,.docx,.xlsx,.xls,.csv,.txt" onChange={handleFile} style={{ display: "none" }} />
        Choose file
      </label>
      <div style={{ fontSize: 13, color: "#374151" }}>Upload a SOP (PDF / DOCX / XLSX / CSV)</div>
    </div>
  );
}
