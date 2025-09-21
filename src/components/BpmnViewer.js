// src/components/BpmnViewer.js
import React, { useEffect, useRef } from "react";
import Modeler from "bpmn-js/lib/Modeler"; // we need the Modeler to saveXML
// Note: do not import CSS from bpmn-js here; your app stylesheet is fine.

export default function BpmnViewer({ xml, onReady }) {
  const containerRef = useRef(null);
  const modelerRef = useRef(null);

  useEffect(() => {
    // Create modeler once
    if (!modelerRef.current) {
      modelerRef.current = new Modeler({
        container: containerRef.current,
        height: "100%",
        width: "100%",
      });
    }
    return () => {
      // cleanup
      try {
        modelerRef.current && modelerRef.current.destroy();
        modelerRef.current = null;
      } catch (e) {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    // import xml whenever prop changes
    if (!xml || !modelerRef.current) return;

    modelerRef.current.importXML(xml, function (err) {
      if (err) {
        console.error("BPMN import error", err);
        // forward a usable error object to parent via onReady
        onReady && onReady({ success: false, error: err, modeler: modelerRef.current });
        return;
      }

      try {
        const canvas = modelerRef.current.get("canvas");
        canvas.zoom("fit-viewport");
      } catch (e) {}

      onReady && onReady({ success: true, error: null, modeler: modelerRef.current });
    });
  }, [xml, onReady]);

  // Basic UI container
  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "420px", // adjust to your layout
        borderRadius: 8,
        border: "1px solid #e6eef2",
        background: "#fff",
      }}
    />
  );
}
