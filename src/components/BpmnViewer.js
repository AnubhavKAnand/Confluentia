import React, { useRef, useEffect, useCallback } from 'react';
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';

const BPMNViewer = ({ xml }) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  const displayDiagram = useCallback(async () => {
    if (containerRef.current && xml) {
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
      
      const viewer = new BpmnViewer({ container: containerRef.current });
      viewerRef.current = viewer;

      try {
        await viewer.importXML(xml);
        const canvas = viewer.get('canvas');
        canvas.zoom('fit-viewport');
      } catch (err) {
        console.error('Error rendering BPMN:', err);
      }
    }
  }, [xml]);

  useEffect(() => {
    displayDiagram();
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
    };
  }, [displayDiagram]);

  return (
    <div 
        ref={containerRef} 
        className="w-full h-96 border rounded-lg bg-gray-50"
        style={{ minHeight: '400px' }}
    ></div>
  );
};

export default BPMNViewer;
