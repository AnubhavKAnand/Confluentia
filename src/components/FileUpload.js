import React from 'react';
import { UploadIcon, FileIcon } from './Icons';

const FileUpload = ({ onFileSelect, isProcessing, error, fileName }) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    onFileSelect(file);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-200">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">1. Upload Document</h2>
      <div className="flex items-center justify-center w-full">
        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadIcon />
            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
            <p className="text-xs text-gray-500">PDF, DOCX, or XLSX</p>
          </div>
          <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx,.xlsx" disabled={isProcessing} />
        </label>
      </div>
      {fileName && !isProcessing && !error && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <FileIcon />
          <span className="ml-3 font-medium text-green-800">{fileName} uploaded successfully. Processing complete.</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
