import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  Download,
  Settings,
  X,
  Sparkles,
  Brain,
  FileCheck,
  MessageSquare,
  FolderOpen,
} from 'lucide-react';
import { exportToCSV } from './utils/csvExport';

type Format = 'table' | 'gherkin';

interface TestCase {
  id: string;
  title: string;
  steps: string;
  expectedResult: string;
  priority: string;
}

interface GenerationResult {
  testCases: string;
  format: Format;
  metadata: {
    fileName: string;
    fileSize: number;
    extractedLength: number;
  };
}

const App: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [format, setFormat] = useState<Format>('table');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploadedFile(file);
    setError(null);
    setResult(null);
    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', format);

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate test cases');
      }

      const data: GenerationResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setUploadedFile(null);
    } finally {
      setIsGenerating(false);
    }
  }, [format]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/markdown': ['.md'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: isGenerating,
  });

  const handleExportCSV = () => {
    if (!result) return;
    exportToCSV(result.testCases, result.format, uploadedFile?.name || 'test-cases');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white shadow-lg z-50 transition-transform duration-300 ${
        showSettings ? 'translate-x-0' : '-translate-x-full'
      } w-80`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Generator Settings</h2>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output Format
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setFormat('table')}
                  className={`w-full p-3 rounded-lg border-2 transition-all ${
                    format === 'table'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">Standard Table</div>
                  <div className="text-xs mt-1">ID, Title, Steps, Expected Result, Priority</div>
                </button>
                <button
                  onClick={() => setFormat('gherkin')}
                  className={`w-full p-3 rounded-lg border-2 transition-all ${
                    format === 'gherkin'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">Gherkin (BDD)</div>
                  <div className="text-xs mt-1">Given-When-Then syntax</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Left Sidebar Navigation */}
        <div className="w-64 bg-white shadow-sm min-h-screen p-6 flex flex-col">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="text-primary-500" size={24} />
              <h1 className="text-xl font-bold text-gray-900">TestCase AI</h1>
            </div>
            <p className="text-xs text-gray-500">AI Test Case Generator</p>
          </div>

          <nav className="space-y-2">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-50 text-primary-700 font-medium"
            >
              <FileCheck size={20} />
              <span>Test Cases</span>
              {result && <span className="ml-auto bg-primary-500 text-white text-xs px-2 py-1 rounded-full">1</span>}
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <FolderOpen size={20} />
              <span>Documents</span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Settings size={20} />
              <span>Settings</span>
            </button>
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <Brain className="text-primary-600" size={16} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">AI Engine</p>
                <p className="text-xs text-gray-500">Ollama Local</p>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-primary-600 mb-2">
                AI Test Case Generator
              </h1>
              <p className="text-gray-600">
                Upload requirement documents and automatically generate comprehensive test cases
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Documents</span>
                  <FileText className="text-gray-400" size={20} />
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {uploadedFile ? 1 : 0}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Test Cases</span>
                  <CheckCircle2 className="text-gray-400" size={20} />
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {result ? 'Generated' : 0}
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">AI Powered</span>
                  <Sparkles size={20} />
                </div>
                <div className="text-sm opacity-90">
                  Ollama Local AI
                </div>
              </div>
            </div>

            {/* Upload Zone */}
            {!result && (
              <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Generate Test Cases
                </h2>
                <p className="text-gray-600 mb-6">
                  Upload a requirement document and we'll generate comprehensive test cases
                </p>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose Output Format
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setFormat('table')}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        format === 'table'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">Standard Table</div>
                      <div className="text-xs mt-1">Structured table format</div>
                    </button>
                    <button
                      onClick={() => setFormat('gherkin')}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        format === 'gherkin'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">Gherkin (BDD)</div>
                      <div className="text-xs mt-1">Given-When-Then syntax</div>
                    </button>
                  </div>
                </div>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
                    isDragActive
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                  } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input {...getInputProps()} />
                  {isGenerating ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="animate-spin text-primary-500 mb-4" size={48} />
                      <p className="text-lg font-medium text-gray-900">Thinking...</p>
                      <p className="text-sm text-gray-500 mt-2">
                        AI is analyzing your document and generating test cases
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-full p-4 mb-4">
                        <Upload className="text-white" size={32} />
                      </div>
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        {isDragActive ? 'Drop file here' : 'Drag & drop your PRD file here'}
                      </p>
                      <p className="text-sm text-gray-500 mb-4">or click to browse</p>
                      <p className="text-xs text-gray-400">
                        Supports PDF and Markdown files (max 10MB)
                      </p>
                    </div>
                  )}
                </div>

                {uploadedFile && !isGenerating && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="text-primary-500" size={20} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(uploadedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Generated Test Cases
                    </h2>
                    <p className="text-sm text-gray-500">
                      Format: {result.format === 'table' ? 'Standard Table' : 'Gherkin (BDD)'}
                    </p>
                  </div>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    <Download size={20} />
                    Export CSV
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {result.testCases}
                  </pre>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setResult(null);
                      setUploadedFile(null);
                      setError(null);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Generate New
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
                  >
                    <Download size={20} />
                    Export to CSV
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
