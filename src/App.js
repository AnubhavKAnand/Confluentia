import React, { useState, useRef } from "react";
import FileUploader from "./components/FileUploader";
import BpmnViewerComponent from "./components/BpmnViewer";
import axios from "axios";
import BpmnModdle from "bpmn-moddle";

export default function App() {
  const [sopText, setSopText] = useState("");
  const [filename, setFilename] = useState("");
  const [bpmnXML, setBpmnXML] = useState("");
  const [status, setStatus] = useState("");
  const [viewerObj, setViewerObj] = useState(null);

  const viewerRef = useRef(null);

  const onTextExtracted = (text, fname) => {
    setSopText(text || "");
    setFilename(fname || "");
    setBpmnXML("");
    setStatus(`Extracted text from ${fname || "file"}. Ready to call OpenAI.`);
  };

  const buildPrompt = (text) => {
    // Craft a focused prompt to ask for a BPMN 2.0 XML representation.
    return `You are an expert process modeller. For the given SOP of "Global Analytics" below, produce a valid BPMN 2.0 XML diagram (the entire <bpmn:definitions> XML).
Only output the BPMN XML, and nothing else, in a single code block. If you can't create a full diagram, provide a minimal but valid BPMN XML with start and end events and the main tasks that map to the SOP.

SOP Content:
${text}

Important: output only the BPMN XML (no commentary).`;
  };

  const callOpenAI = async () => {
    if (!sopText) {
      alert("Please upload a file first");
      return;
    }
    setStatus("Sending to OpenAI...");
    try {
      const prompt = buildPrompt(sopText);
      // POST to our serverless function
      const res = await axios.post("/api/openai", {
        prompt
      });
      if (res.data?.xml) {
        setBpmnXML(res.data.xml);
        setStatus("Got BPMN XML from OpenAI.");
      } else if (res.data?.text) {
        // try to extract xml from text
        const payload = res.data.text;
        // extract code block with xml or raw xml
        const xmlMatch = payload.match(/```(?:xml)?\s*([\s\S]*?)```/i) || payload.match(/(<\?xml[\s\S]*<\/bpmn:definitions>)/i) || payload.match(/(<bpmn:definitions[\s\S]*<\/bpmn:definitions>)/i);
        const xml = xmlMatch ? xmlMatch[1] : payload;
        setBpmnXML(xml.trim());
        setStatus("Got BPMN-like output from OpenAI (extracted).");
      } else {
        setStatus("OpenAI returned unexpected result. Check server logs.");
        alert("OpenAI returned unexpected result. Check console.");
        console.log(res.data);
      }
    } catch (err) {
      console.error("OpenAI call failed:", err);
      setStatus("OpenAI request failed. Check console.");
      alert("OpenAI request failed. See console.");
    }
  };

  const onViewerReady = ({ success, error, viewer }) => {
    if (success) {
      setViewerObj(viewer);
      viewerRef.current = viewer;
    } else {
      console.error("viewer Error:", error);
      setViewerObj(null);
    }
  };

  const downloadXML = async () => {
    if (!viewerRef.current) {
      alert("No diagram loaded");
      return;
    }
    try {
      const { xml } = await viewerRef.current.saveXML({ format: true });
      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename ? filename.replace(/\.[^/.]+$/, "") + "-diagram.bpmn" : "diagram.bpmn";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setStatus("Downloaded BPMN XML file.");
    } catch (err) {
      console.error("Save XML failed", err);
      alert("Failed to save XML");
    }
  };

  const exportJSON = async () => {
    if (!bpmnXML) {
      alert("No BPMN loaded");
      return;
    }
    try {
      const moddle = new BpmnModdle();
      const { rootElement } = await moddle.fromXML(bpmnXML);
      // The returned structure is large; we'll JSON.stringify with replacer to avoid circulars
      const json = JSON.stringify(rootElement, (k, v) => {
        // remove circular references and functions
        if (k === "parent") return undefined;
        if (typeof v === "function") return undefined;
        return v;
      }, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename ? filename.replace(/\.[^/.]+$/, "") + "-diagram.json" : "diagram.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setStatus("Exported BPMN model as JSON.");
    } catch (err) {
      console.error("Export JSON failed", err);
      alert("Failed to export JSON. Check console.");
    }
  };

  return (
    <div className="app">
      <div className="header">
        <div>
          <h1>SOP → BPMN (Viewer)</h1>
          <div className="small">Upload SOP file (PDF / DOCX / XLSX). I'll call OpenAI to produce BPMN XML and render it.</div>
        </div>
      </div>

      <div className="controls">
        <FileUploader onTextExtracted={onTextExtracted} />
        <button onClick={callOpenAI} className="secondary">Generate BPMN via OpenAI</button>
        <button onClick={() => { setBpmnXML(""); setStatus(""); setSopText(""); setFilename(""); }} className="ghost">Reset</button>
      </div>

      <div className="small">Status: {status}</div>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div className="small" style={{ marginBottom: 8 }}>Extracted SOP (editable) — optionally edit before sending</div>
            <textarea value={sopText} onChange={(e)=>setSopText(e.target.value)} />
          </div>

          <div style={{ width: 360 }}>
            <div className="small" style={{ marginBottom: 8 }}>BPMN XML output (editable)</div>
            <textarea value={bpmnXML} onChange={(e)=>setBpmnXML(e.target.value)} />
            <div className="sidebar">
              <button onClick={downloadXML} disabled={!bpmnXML}>Download BPMN (.bpmn)</button>
              <button onClick={exportJSON} disabled={!bpmnXML}>Download Model (.json)</button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="small" style={{ marginBottom: 8 }}>Rendered diagram</div>
          {bpmnXML ? (
            <BpmnViewerComponent xml={bpmnXML} onReady={onViewerReady} />
          ) : (
            <div style={{ border: "1px dashed #e6eef2", padding: 18, borderRadius: 8 }}>
              Upload and generate a BPMN diagram. The viewer appears here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
