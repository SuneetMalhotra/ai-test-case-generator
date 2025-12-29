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
  Heart,
  FolderOpen,
  FileCheck,
  MessageSquare,
  Sparkles,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { exportToCSV } from './utils/csvExport';

type AIProvider = 'ollama' | 'openai';
type ScenarioType = 'functional' | 'edge-case' | 'negative';

interface TestCase {
  id: string;
  title: string;
  type: ScenarioType;
  steps: string[];
  expectedResult: string;
  priority: 'High' | 'Medium' | 'Low';
}

interface Document {
  id: string;
  name: string;
  uploadedAt: Date;
  testCasesCount: number;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'matches' | 'documents' | 'test-cases' | 'messages' | 'settings'>('matches');
  const [aiProvider, setAiProvider] = useState<AIProvider>('ollama');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);

  const totalDocuments = documents.length;
  const totalTestCases = testCases.length;

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploadedFile(file);
    setError(null);
    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', 'table');
      formData.append('scenarioTypes', 'functional,edge-case,negative');

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate test cases');
      }

      const data = await response.json();
      
      // Parse test cases from response
      const parsedTestCases = parseTestCases(data.testCases);
      setTestCases(parsedTestCases);
      
      // Add document to list
      const newDoc: Document = {
        id: Date.now().toString(),
        name: file.name,
        uploadedAt: new Date(),
        testCasesCount: parsedTestCases.length,
      };
      setDocuments([newDoc, ...documents]);
      
      setActiveTab('test-cases');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setUploadedFile(null);
    } finally {
      setIsGenerating(false);
    }
  }, [documents]);

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

  const parseTestCases = (testCasesString: string): TestCase[] => {
    // Parse the test cases string into structured TestCase objects
    // This is a simplified parser - you may need to adjust based on your backend response
    try {
      const lines = testCasesString.split('\n').filter(line => line.trim());
      const cases: TestCase[] = [];
      
      let currentCase: Partial<TestCase> | null = null;
      for (const line of lines) {
        if (line.match(/^\d+\.|^TC-\d+/i)) {
          if (currentCase) cases.push(currentCase as TestCase);
          currentCase = {
            id: `tc-${cases.length + 1}`,
            title: line.replace(/^\d+\.\s*|^TC-\d+\s*/i, '').trim(),
            type: 'functional' as ScenarioType,
            steps: [],
            expectedResult: '',
            priority: 'Medium' as const,
          };
        } else if (currentCase && line.toLowerCase().includes('step')) {
          currentCase.steps?.push(line.trim());
        } else if (currentCase && line.toLowerCase().includes('expected')) {
          currentCase.expectedResult = line.replace(/expected\s*:?/i, '').trim();
        }
      }
      if (currentCase) cases.push(currentCase as TestCase);
      
      return cases.length > 0 ? cases : [{
        id: 'tc-1',
        title: 'Sample Test Case',
        type: 'functional',
        steps: ['Step 1', 'Step 2'],
        expectedResult: 'Expected result',
        priority: 'High',
      }];
    } catch {
      return [];
    }
  };

  const handleExportCSV = () => {
    if (testCases.length === 0) return;
    const csvContent = testCases.map(tc => ({
      ID: tc.id,
      Title: tc.title,
      Type: tc.type,
      Steps: tc.steps.join('; '),
      'Expected Result': tc.expectedResult,
      Priority: tc.priority,
    }));
    exportToCSV(JSON.stringify(csvContent), 'table', 'test-cases');
  };

  const sidebarItems = [
    { id: 'matches', label: 'Matches', icon: Heart, count: testCases.length },
    { id: 'documents', label: 'Documents', icon: FolderOpen, count: totalDocuments },
    { id: 'test-cases', label: 'Test Cases', icon: FileCheck, count: totalTestCases },
    { id: 'messages', label: 'Messages', icon: MessageSquare, count: 0 },
    { id: 'settings', label: 'Settings', icon: Settings, count: null },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Sparkles className="text-rose-500" size={24} />
            <h1 className="text-xl font-bold text-gray-900">Testcase Generator</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-rose-50 text-rose-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} />
                  <span>{item.label}</span>
                </div>
                {item.count !== null && item.count > 0 && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isActive ? 'bg-rose-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            {activeTab === 'matches' && 'Find Your Match'}
            {activeTab === 'documents' && 'Documents'}
            {activeTab === 'test-cases' && 'Test Cases'}
            {activeTab === 'messages' && 'Messages'}
            {activeTab === 'settings' && 'Settings'}
          </h2>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'matches' && (
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Dashboard Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">Total Documents</h3>
                    <FolderOpen className="text-gray-400" size={20} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{totalDocuments}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">Total Test Cases</h3>
                    <FileCheck className="text-gray-400" size={20} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{totalTestCases}</p>
                </div>

                <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg shadow-sm p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-white/90">AI Test Generation</h3>
                    <Sparkles size={20} />
                  </div>
                  <p className="text-3xl font-bold">Ready</p>
                  <p className="text-sm text-white/80 mt-2">Upload a PRD to start</p>
                </div>
              </div>

              {/* Find Your Match Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Find Your Match</h3>

                {/* AI Provider Toggle */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    AI Provider
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setAiProvider('ollama')}
                      className={`flex-1 px-6 py-3 rounded-lg border-2 transition-all ${
                        aiProvider === 'ollama'
                          ? 'border-rose-500 bg-rose-50 text-rose-700 font-medium'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Brain size={18} />
                        <span>Ollama (Local LLM)</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setAiProvider('openai')}
                      className={`flex-1 px-6 py-3 rounded-lg border-2 transition-all ${
                        aiProvider === 'openai'
                          ? 'border-rose-500 bg-rose-50 text-rose-700 font-medium'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Sparkles size={18} />
                        <span>OpenAI (GPT)</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Upload Zone */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
                    isDragActive
                      ? 'border-rose-500 bg-rose-50'
                      : 'border-gray-300 hover:border-rose-400 hover:bg-gray-50'
                  } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input {...getInputProps()} />
                  {isGenerating ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="animate-spin text-rose-500 mb-4" size={48} />
                      <p className="text-lg font-medium text-gray-900">Generating test cases...</p>
                      <p className="text-sm text-gray-500 mt-2">
                        AI is analyzing your document and creating scenarios
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="bg-rose-500 rounded-full p-4 mb-4">
                        <Upload className="text-white" size={32} />
                      </div>
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        {isDragActive ? 'Drop your PRD here' : 'Drag & drop your PRD file here'}
                      </p>
                      <p className="text-sm text-gray-500 mb-4">or click to browse</p>
                      <p className="text-xs text-gray-400">
                        Supports PDF, Markdown, and Text files (max 10MB)
                      </p>
                    </div>
                  )}
                </div>

                {uploadedFile && !isGenerating && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="text-rose-500" size={20} />
                      <span className="text-sm text-gray-700">{uploadedFile.name}</span>
                    </div>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                    <AlertCircle className="text-red-500" size={20} />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="max-w-6xl mx-auto">
              {totalDocuments === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <FolderOpen className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Yet</h3>
                  <p className="text-gray-500 mb-6">Upload your first PRD to get started</p>
                  <button
                    onClick={() => setActiveTab('matches')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 text-white font-medium rounded-lg hover:bg-rose-600 transition-colors"
                  >
                    <Plus size={20} />
                    Upload Document
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-rose-50 rounded-lg p-3">
                          <FileText className="text-rose-500" size={24} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{doc.name}</h3>
                          <p className="text-sm text-gray-500">
                            {doc.testCasesCount} test cases • {doc.uploadedAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button className="text-rose-500 hover:text-rose-600">
                        <Download size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'test-cases' && (
            <div className="max-w-6xl mx-auto">
              {totalTestCases === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <FileCheck className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Cases Yet</h3>
                  <p className="text-gray-500 mb-6">Generate test cases from your PRD documents</p>
                  <button
                    onClick={() => setActiveTab('matches')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 text-white font-medium rounded-lg hover:bg-rose-600 transition-colors"
                  >
                    <Plus size={20} />
                    Generate Test Cases
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {totalTestCases} Test Cases Generated
                    </h3>
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500 text-white font-medium rounded-lg hover:bg-rose-600 transition-colors"
                    >
                      <Download size={18} />
                      Export CSV
                    </button>
                  </div>

                  <div className="space-y-4">
                    {testCases.map((testCase) => (
                      <div
                        key={testCase.id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">{testCase.title}</h4>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                testCase.type === 'functional'
                                  ? 'bg-blue-100 text-blue-700'
                                  : testCase.type === 'edge-case'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {testCase.type.replace('-', ' ').toUpperCase()}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                testCase.priority === 'High'
                                  ? 'bg-red-100 text-red-700'
                                  : testCase.priority === 'Medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {testCase.priority} Priority
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Steps:</h5>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                              {testCase.steps.map((step, idx) => (
                                <li key={idx}>{step}</li>
                              ))}
                            </ol>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Expected Result:</h5>
                            <p className="text-sm text-gray-600">{testCase.expectedResult}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="max-w-6xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Messages</h3>
                <p className="text-gray-500">Messages feature coming soon</p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default AI Provider
                    </label>
                    <select
                      value={aiProvider}
                      onChange={(e) => setAiProvider(e.target.value as AIProvider)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    >
                      <option value="ollama">Ollama (Local LLM)</option>
                      <option value="openai">OpenAI (GPT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Export Format
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500">
                      <option value="table">Standard Table</option>
                      <option value="gherkin">Gherkin (BDD)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
