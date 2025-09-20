import React, { useEffect, useRef } from 'react';
import BpmnViewerLib from 'bpmn-js/dist/bpmn-viewer.development.js'; // viewer-only

export default function BpmnViewer({ xml }) {
  const ref = useRef();

  useEffect(() => {
    if (!xml) return;
    const viewer = new BpmnViewerLib({ container: ref.current });
    viewer.importXML(xml).then(() => {
      const canvas = viewer.get('canvas');
      canvas.zoom('fit-viewport');
    }).catch(err => console.error('bpmn render error', err));
    return () => viewer.destroy();
  }, [xml]);

  return <div ref={ref} style={{ border: '1px solid #ddd', height: 520 }} />;
}
