Automated Process Map Generator
This is a React-based web application that allows users to upload Standard Operating Procedure (SOP) documents (in PDF, DOCX, or XLSX format) and automatically generates Business Process Model and Notation (BPMN) diagrams. The application also identifies and extracts associated risks and controls from the document.

The core intelligence is powered by the Google Gemini API, which analyzes the document's text and returns a structured JSON object containing the process maps and related data.

Features
File Upload: Supports PDF, Microsoft Word (.docx), and Microsoft Excel (.xlsx) files.

Text Extraction: Client-side text extraction from various document formats.

AI-Powered Analysis: Leverages the Gemini API to understand document content and generate process models.

BPMN Visualization: Renders interactive BPMN 2.0 diagrams directly in the browser.

Risk & Control Identification: Displays tables of risks and controls associated with each process.

JSON Export: Allows users to download the complete structured data as a JSON file.

Project Structure
/
├── public/
│   ├── index.html
│   └── ... (other public assets)
├── src/
│   ├── components/
│   │   ├── BPMNViewer.js
│   │   ├── FileUpload.js
│   │   ├── Icons.js
│   │   ├── Loader.js
│   │   └── ProcessDetail.js
│   ├── services/
│   │   └── geminiService.js
│   ├── utils/
│   │   └── fileExtractor.js
│   ├── App.js
│   ├── index.css
│   └── index.js
├── .gitignore
├── package.json
├── README.md
└── tailwind.config.js

Getting Started
Prerequisites
Node.js (v14 or later)

npm or yarn

Installation
Clone the repository:

git clone <repository-url>
cd process-map-generator

Install dependencies:

npm install

or

yarn install

Running the Application
To start the development server, run:

npm start

The application will be available at http://localhost:3000.

Building for Production
To create a production-ready build, run:

npm run build

This will create a build directory with the optimized and minified assets, ready for deployment.

Deployment
This application is configured for easy deployment on static hosting platforms like Vercel, Netlify, or GitHub Pages. Simply connect your repository to your hosting provider of choice and follow their instructions for deploying a Create React App project.