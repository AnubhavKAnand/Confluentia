import React, { useState } from 'react';
import axios from 'axios';
import ProcessView from './ProcessView.js';

export default function UploadForm() {
  const [file, setFile] = useState(null);
  const [processId, setProcessId] = useState(null);
  const [status, setStatus] = useState(null);

  async function upload() {
    if (!file) return alert('Choose file');
    const fd = new FormData();
    fd.append('file', file);
    const resp = await axios.post('/api/process/upload', fd);
    setProcessId(resp.data.processId);
    setStatus(resp.data.status);
    poll(resp.data.processId);
  }

  function poll(id) {
    const interval = setInterval(async () => {
      try {
        const r = await axios.get(`/api/process/${id}/status`);
        setStatus(r.data.status);
        if (r.data.status === 'DONE' || r.data.status === 'ERROR') clearInterval(interval);
      } catch (e) {
        console.error(e);
        clearInterval(interval);
      }
    }, 2500);
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <input type="file" onChange={e => setFile(e.target.files[0])} />
        <button style={{ marginLeft: 8 }} onClick={upload}>Upload & Process</button>
      </div>

      {processId && <div style={{ marginBottom: 12 }}>
        <strong>Process ID:</strong> {processId} — <strong>Status:</strong> {status}
      </div>}

      {processId && status === 'DONE' && <ProcessView id={processId} />}
      {processId && status === 'ERROR' && <div style={{ color: 'red' }}>Processing Failed — check admin logs</div>}
    </div>
  );
}
