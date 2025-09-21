import React, { useEffect, useRef } from "react";
import BpmnViewer from "bpmn-js";
import BpmnModdle from "bpmn-moddle";

export default function BpmnViewerComponent({ xml, onReady }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    // init viewer once
    if (!viewerRef.current) {
      viewerRef.current = new BpmnViewer({
        container: containerRef.current,
        height: "100%",
        width: "100%",
      });
    }
    return () => {
      // cleaning up on unmount
      try {
        viewerRef.current && viewerRef.current.destroy();
      } catch (e) {}
    };
  }, []);

  useEffect(() => {
    if (!xml) return;
    const v = viewerRef.current;
    v.importXML(xml, (err) => {
      if (err) {
        console.error("bpmn import error", err);
        onReady && onReady({ success: false, error: err });
      } else {
        try {
          v.get("canvas").zoom("fit-viewport");
        } catch {}
        onReady && onReady({ success: true, viewer: v });
      }
    });
  }, [xml, onReady]);

  // helpers exposed via onReady callback (viewer)
  // but parent can call viewer.saveXML via the viewer instance returned in onReady

  // Provide UI wrapper
  return <div className="viewer" ref={containerRef} />;
}
