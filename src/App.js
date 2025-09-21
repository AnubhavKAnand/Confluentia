// src/App.js
import React, { useState, useRef } from "react";
import axios from "axios";
import FileUploader from "./components/FileUploader";
import BpmnViewer from "./components/BpmnViewer"; // your viewer component created before
import BpmnModdle from "bpmn-moddle";

export default function App() {
  const [sopText, setSopText] = useState("");
  const [filename, setFilename] = useState("");
  const [bpmnXML, setBpmnXML] = useState("");
  const [status, setStatus] = useState("");
  const modelerRef = useRef(null);

  // Called by FileUploader
  const onTextExtracted = (text, fname) => {
    setSopText(text || "");
    setFilename(fname || "");
    setBpmnXML("");
    setStatus(`Extracted text from ${fname || "file"}. Ready to generate.`);
  };

  // Sends sopText to the backend which returns base64 .bpmn
  const callGeminiFile = async () => {
    if (!sopText || !sopText.trim()) {
      alert("Please upload a file first or paste SOP text.");
      return;
    }
    setStatus("Requesting .bpmn file from backend...");
    try {
      const payload = { sopText, filenamePrefix: filename ? filename.replace(/\.[^/.]+$/, "") : "diagram" };
      const res = await axios.post("/api/gemini-file", payload, { timeout: 120000 });
      console.log("gemini-file response:", res.data);
      if (res.data?.ok && res.data?.bpmnBase64 && res.data?.filename) {
        const xmlString = atob(res.data.bpmnBase64);
        // store xml for viewer
        setBpmnXML(xmlString);
        setStatus(`Received diagram: ${res.data.filename}`);
      } else {
        setStatus("Backend did not return a .bpmn file. Check console.");
        console.error("Unexpected /api/gemini-file response:", res.data);
        alert("Backend did not return a .bpmn file. See console for details.");
      }
    } catch (err) {
      console.error("Request to backend failed:", err);
      const serverData = err?.response?.data;
      setStatus(`Request failed: ${err?.message || "unknown"}`);
      if (serverData) {
        console.error("Server response:", serverData);
        alert("Server error: " + (serverData.error || serverData.message || JSON.stringify(serverData)));
      } else {
        alert("Request failed. Check console and server logs.");
      }
    }
  };

  // BpmnViewer onReady callback
  const onViewerReady = ({ success, error, modeler }) => {
    if (success) {
      modelerRef.current = modeler;
      setStatus("Diagram rendered.");
    } else {
      modelerRef.current = modeler || null;
      console.error("Viewer import error:", error);
      setStatus("Failed to render diagram: see console.");
    }
  };

  // Save .bpmn from the modeler
  const handleDownloadBPMN = async () => {
    try {
      // prefer to save from the live modeler so any edits persist
      if (modelerRef.current) {
        const { xml } = await modelerRef.current.saveXML({ format: true });
        const blob = new Blob([xml], { type: "application/xml" });
        const name = (filename ? filename.replace(/\.[^/.]+$/, "") : "diagram") + ".bpmn";
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setStatus(`Downloaded ${name}`);
        return;
      }

      // fallback: if modeler not ready but we have original xml string
      if (bpmnXML) {
        const blob = new Blob([bpmnXML], { type: "application/xml" });
        const name = (filename ? filename.replace(/\.[^/.]+$/, "") : "diagram") + ".bpmn";
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setStatus(`Downloaded ${name}`);
        return;
      }

      alert("No diagram available to download.");
    } catch (err) {
      console.error("saveXML error", err);
      alert("Failed to download .bpmn. See console.");
    }
  };

  // Export moddle JSON model
  const handleDownloadJSON = async () => {
    try {
      if (!modelerRef.current && !bpmnXML) {
        alert("No diagram loaded to export.");
        return;
      }

      // get XML from modeler if present
      const xml = modelerRef.current ? (await modelerRef.current.saveXML({ format: true })).xml : bpmnXML;

      const moddle = new BpmnModdle();
      const definitions = await new Promise((resolve, reject) => {
        moddle.fromXML(xml, (err, defs) => {
          if (err) reject(err);
          else resolve(defs);
        });
      });

      const json = JSON.stringify(definitions, function replacer(key, value) {
        if (key === "parent") return undefined;
        if (typeof value === "function") return undefined;
        return value;
      }, 2);

      const blob = new Blob([json], { type: "application/json" });
      const name = (filename ? filename.replace(/\.[^/.]+$/, "") : "diagram") + "-model.json";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus(`Downloaded ${name}`);
    } catch (err) {
      console.error("Export JSON failed", err);
      alert("Failed to export JSON. See console.");
    }
  };

  const isXmlComplete = (xml) => xml && typeof xml === "string" && xml.trim().endsWith("</bpmn:definitions>");

  return (
    <div style={{ maxWidth: 1100, margin: "28px auto", background: "#fff", padding: 20, borderRadius: 10 }}>
      <h2>SOP → BPMN (Viewer)</h2>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <FileUploader onTextExtracted={onTextExtracted} />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={callGeminiFile} style={{ padding: "8px 12px", borderRadius: 8 }}>Generate BPMN</button>
          <button onClick={() => { setSopText(""); setBpmnXML(""); setFilename(""); setStatus(""); }} style={{ padding: "8px 12px", borderRadius: 8, background: "#f3f4f6" }}>Reset</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Extracted SOP (editable) — optionally edit before sending</div>
          <textarea value={sopText} onChange={(e) => setSopText(e.target.value)} style={{ width: "100%", height: 300, borderRadius: 8, padding: 12 }} />
        </div>

        <div style={{ width: 520 }}>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>BPMN Diagram</div>

          {bpmnXML ? (
            isXmlComplete(bpmnXML) ? (
              <BpmnViewer xml={bpmnXML} onReady={onViewerReady} />
            ) : (
              <div style={{ border: "1px solid #fbbf24", borderRadius: 8, padding: 8, background: "#fffaf0" }}>
                <div style={{ color: "#92400e", marginBottom: 6 }}>Warning: generated BPMN output may be incomplete. Viewer will attempt to render.</div>
                <BpmnViewer xml={bpmnXML} onReady={onViewerReady} />
              </div>
            )
          ) : (
            <div style={{ border: "1px dashed #e6eef2", padding: 24, borderRadius: 8, minHeight: 300 }}>
              Diagram will render here after you generate BPMN.
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={handleDownloadBPMN} disabled={!bpmnXML} style={{ padding: "8px 14px", borderRadius: 8 }}>Download BPMN (.bpmn)</button>
            <button onClick={handleDownloadJSON} disabled={!bpmnXML} style={{ padding: "8px 14px", borderRadius: 8, background: "#0ea5a4", color: "#fff" }}>Download Model (.json)</button>
          </div>

          <div style={{ marginTop: 10 }}>Status: {status}</div>
        </div>
      </div>
    </div>
  );
}
