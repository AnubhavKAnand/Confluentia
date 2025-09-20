import React from 'react';
import UploadForm from './components/UploadForm.js';

export default function App() {
  return (
    <div style={{ padding: 20, fontFamily: 'Inter, Arial, sans-serif' }}>
      <h1>Automated BPMN Generator (JS)</h1>
      <p>Upload an SOP document (PDF / DOCX / XLSX). Backend will extract processes and generate BPMN + JSON.</p>
      <UploadForm />
    </div>
  );
}
