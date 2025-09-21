import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// File: src/App.js
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import pdfToText from "react-pdftotext";
import * as XLSX from "xlsx";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import BpmnViewer from "bpmn-js";
import "./App.css";

function App() {
  const [fileText, setFileText] = useState("");
  const [bpmnXML, setBpmnXML] = useState("");
  const [error, setError] = useState("");
  const viewerRef = useRef(null);
  const [viewerInstance, setViewerInstance] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const name = file.name.toLowerCase();

    try {
      if (file.type === "application/pdf") {
        const text = await pdfToText(file);
        setFileText(text);
      } else if (name.endsWith(".docx")) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const content = evt.target.result;
          const doc = new Docxtemplater(new PizZip(content), {});
          setFileText(doc.getFullText());
        };
        reader.readAsBinaryString(file);
      } else if (name.endsWith(".xls") || name.endsWith(".xlsx")) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const data = evt.target.result;
          const wb = XLSX.read(data, { type: "binary" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          setFileText(XLSX.utils.sheet_to_csv(ws, { header: 1 }));
        };
        reader.readAsBinaryString(file);
      } else {
        setError("Unsupported file type");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to read file");
    }
  };

  useEffect(() => {
    const callAI = async () => {
      if (!fileText) return;
      try {
        const prompt = `For the given SOP of global analytics, try to generate a BPMN viewer.\n\n${fileText}`;
        const response = await axios.post(
          "https://api.openai.com/v1/completions",
          {
            model: "text-davinci-003",
            prompt: prompt,
            max_tokens: 1500,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.REACT_APP_OPENAI_KEY}`,
            },
          }
        );
        setBpmnXML(response.data.choices[0].text.trim());
      } catch (err) {
        console.error(err);
        setError("OpenAI API request failed");
      }
    };
    callAI();
  }, [fileText]);

  useEffect(() => {
    if (!bpmnXML) return;
    if (!viewerInstance) {
      const viewer = new BpmnViewer({ container: viewerRef.current });
      setViewerInstance(viewer);
    }
    viewerInstance?.importXML(bpmnXML, (err) => {
      if (err) {
        console.error("Could not render BPMN", err);
        setError("Invalid BPMN output");
      } else {
        viewerInstance.get("canvas").zoom("fit-viewport");
      }
    });
  }, [bpmnXML, viewerInstance]);

  const handleDownload = () => {
    if (!viewerInstance) return;
    viewerInstance.saveXML({ format: true }).then(({ xml }) => {
      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "diagram.bpmn";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  };

  return (
    <div className="app-container">
      <h1>SOP → BPMN Generator</h1>
      <input type="file" accept=".pdf,.docx,.xls,.xlsx" onChange={handleFileChange} />
      {error && <p className="error-text">{error}</p>}
      {viewerInstance && (
        <button className="download-btn" onClick={handleDownload}>Download BPMN Model</button>
      )}
      <div ref={viewerRef} className="bpmn-container">
        {!bpmnXML && <p>Upload a file to generate BPMN diagram...</p>}
      </div>
    </div>
  );
}

export default App;