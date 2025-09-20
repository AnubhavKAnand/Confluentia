import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BpmnViewer from './BpmnViewer.js';

export default function ProcessView({ id }) {
  const [json, setJson] = useState(null);
  const [bpmnXml, setBpmnXml] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await axios.get(`/api/process/${id}/json`);
        setJson(r.data);
        // choose first process bpmn
        if (r.data && r.data[0]) {
          const pname = (r.data[0].processName || 'process').replace(/[^\w\-\.]/g,'_') + '.bpmn';
          try {
            const b = await axios.get(`/api/process/${id}/diagram?name=${pname}`);
            setBpmnXml(b.data);
          } catch {
            const b2 = await axios.get(`/api/process/${id}/diagram`);
            setBpmnXml(b2.data);
          }
        }
      } catch (e) { console.error(e); }
    })();
  }, [id]);

  function downloadJson() {
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u; a.download = `process_${id}.json`; a.click(); URL.revokeObjectURL(u);
  }

  return (
    <div style={{ marginTop: 18 }}>
      <button onClick={downloadJson}>Download JSON</button>
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <h3>Extracted JSON</h3>
          <pre style={{ background: '#f6f8fa', padding: 12, maxHeight: 520, overflow: 'auto' }}>{json ? JSON.stringify(json, null, 2) : 'Loading...'}</pre>
        </div>
        <div style={{ flex: 1 }}>
          <h3>BPMN Diagram</h3>
          {bpmnXml ? <BpmnViewer xml={bpmnXml} /> : 'Loading BPMN...'}
        </div>
      </div>
    </div>
  );
}
