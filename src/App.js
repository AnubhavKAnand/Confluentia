// src/App.js (only the relevant updated sections shown)
// Make sure you have these imports at top:
import React, { useState, useRef } from "react";
import axios from "axios";
import BpmnViewer from "./components/BpmnViewer";
import BpmnModdle from "bpmn-moddle";

// ... your other imports

export default function App() {
  // your existing state
  const [sopText, setSopText] = useState("");
  const [filename, setFilename] = useState("");
  const [bpmnXML, setBpmnXML] = useState(""); // this holds the raw XML coming back
  const [status, setStatus] = useState("");
  const modelerRef = useRef(null); // holds modeler instance when ready

  // existing: function that receives OpenAI/Gemini output and sets bpmnXML
  // when you receive xml from backend, call setBpmnXML(xmlString)

  // Callback passed into BpmnViewer
  const onViewerReady = ({ success, error, modeler }) => {
    if (success) {
      modelerRef.current = modeler;
      setStatus("Diagram rendered.");
    } else {
      modelerRef.current = modeler; // may still be present
      console.error("Viewer import error:", error);
      setStatus("Failed to render diagram: see console.");
      // Optional: show user a toast
    }
  };

  // Download .bpmn file (use modeler.saveXML)
  const handleDownloadBPMN = async () => {
    try {
      if (!modelerRef.current) {
        alert("No diagram loaded to save.");
        return;
      }
      const { xml } = await modelerRef.current.saveXML({ format: true });
      // create blob and download
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
    } catch (err) {
      console.error("saveXML error", err);
      alert("Failed to download .bpmn. See console for details.");
    }
  };

  // Download model as JSON using bpmn-moddle
  const handleDownloadJSON = async () => {
    try {
      // Prefer saving from the live modeler so flows & IDs reflect any edits.
      if (!modelerRef.current) {
        alert("No diagram loaded to export.");
        return;
      }
      const { xml } = await modelerRef.current.saveXML({ format: true });
      const moddle = new BpmnModdle();

      // promisify moddle.fromXML callback
      const definitions = await new Promise((resolve, reject) => {
        moddle.fromXML(xml, (err, defs) => {
          if (err) reject(err);
          else resolve(defs);
        });
      });

      // Convert the moddle definitions to a safe JSON; remove circulars & functions
      const json = JSON.stringify(definitions, function replacer(key, value) {
        // Drop parent refs and functions to avoid cycles
        if (key === "parent") return undefined;
        if (typeof value === "function") return undefined;
        // Some moddle objects have businessObject links; we keep plain values
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
      alert("Failed to export JSON. See console for details.");
    }
  };

  // Basic XML completeness check (optional)
  const isXmlComplete = (xml) => {
    if (!xml || typeof xml !== "string") return false;
    return xml.trim().endsWith("</bpmn:definitions>");
  };

  // Your UI return (only the right pane portion shown; integrate into existing layout)
  return (
    <div className="app">
      {/* ... top controls, file uploader, SOP textarea etc. ... */}

      <div style={{ display: "flex", gap: 12 }}>
        {/* Left side: SOP textarea or extracted text */}
        <div style={{ flex: 1 }}>
          <div className="small">Extracted SOP (editable) — optionally edit before sending</div>
          <textarea value={sopText} onChange={(e) => setSopText(e.target.value)} style={{ height: 200 }} />
        </div>

        {/* Right side: BPMN viewer and download buttons (replaces the XML textarea) */}
        <div style={{ width: 520 }}>
          <div className="small" style={{ marginBottom: 8 }}>BPMN Diagram</div>

          {/* Validate before passing xml to viewer; otherwise show message */}
          {bpmnXML ? (
            isXmlComplete(bpmnXML) ? (
              <BpmnViewer xml={bpmnXML} onReady={onViewerReady} />
            ) : (
              <div style={{ border: "1px solid #fbbf24", padding: 12, borderRadius: 8, background: "#fffaf0" }}>
                <div style={{ color: "#92400e", marginBottom: 8 }}>Warning: generated BPMN output looks incomplete.</div>
                {/* still attempt to render it, but warn user */}
                <BpmnViewer xml={bpmnXML} onReady={onViewerReady} />
              </div>
            )
          ) : (
            <div style={{ border: "1px dashed #e6eef2", padding: 20, borderRadius: 8, minHeight: 200 }}>
              Diagram will render here after you generate BPMN.
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={handleDownloadBPMN} disabled={!bpmnXML}>Download BPMN (.bpmn)</button>
            <button onClick={handleDownloadJSON} disabled={!bpmnXML}>Download Model (.json)</button>
          </div>
          <div style={{ marginTop: 8, color: "#374151" }}>Status: {status}</div>
        </div>
      </div>

      {/* ... optionally rest of page ... */}
    </div>
  );
}
