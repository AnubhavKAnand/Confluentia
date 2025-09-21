import React, { useState } from 'react';
import { extractTextFromFile } from './utils/fileExtractor';
import { processWithGemini } from './services/geminiService';
import FileUpload from './components/FileUpload';
import ProcessDetail from './components/ProcessDetail';
import Loader from './components/Loader';
import { DownloadIcon } from './components/Icons';

export default function App() {
  const [fileName, setFileName] = useState('');
  const [processedData, setProcessedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;

    setFileName(selectedFile.name);
    setError(null);
    setProcessedData(null);
    setIsLoading(true);

    try {
      const text = await extractTextFromFile(selectedFile);
      const result = await processWithGemini(text);
      setProcessedData(result);
    } catch (err) {
      console.error("Processing error:", err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadJson = () => {
    if (!processedData) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(processedData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${fileName.split('.')[0]}_process_map.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      <div className="container mx-auto p-4 md:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Automated Process Map Generator</h1>
          <p className="text-lg text-gray-600 mt-2">Upload your SOP document to automatically generate BPMN diagrams, identify risks, and define controls.</p>
        </header>

        <main>
          <FileUpload onFileSelect={handleFileChange} isProcessing={isLoading} error={error} fileName={fileName} />
          
          {isLoading && <Loader />}
          
          {error && !isLoading && (
            <div className="my-8 max-w-3xl mx-auto p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg" role="alert">
              <p className="font-bold">An Error Occurred</p>
              <p>{error}</p>
            </div>
          )}

          {processedData && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-6 max-w-3xl mx-auto">
                <h2 className="text-2xl font-semibold text-gray-700">2. Generated Processes</h2>
                <button onClick={downloadJson} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center">
                  <DownloadIcon />
                  Download JSON
                </button>
              </div>

              {processedData.found_processes ? (
                <div className="space-y-8">
                  {processedData.processes.map((process, index) => (
                    <ProcessDetail key={index} process={process} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600">No processes were found in the document.</p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
