import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  Loader2,
  Download,
  Settings,
  X,
  LayoutDashboard,
  FolderOpen,
  FileCheck,
  MessageSquare,
  Sparkles,
  Plus,
  AlertCircle,
  Brain,
} from 'lucide-react';
import { exportToCSV } from './utils/csvExport';

type AIProvider = 'gemini' | 'ollama';
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'documents' | 'test-cases' | 'messages' | 'settings'>('dashboard');
  const [aiProvider, setAiProvider] = useState<AIProvider>('gemini');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rawTestCases, setRawTestCases] = useState<string | null>(null);

  const totalDocuments = documents.length;
  const totalTestCases = testCases.length;

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Early file size validation (5MB limit for PDFs, accounting for Base64 overhead)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError(`File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB. Please use a smaller file.`);
      return;
    }
    
    setUploadedFile(file);
    setError(null);
    setIsGenerating(true);

    try {
      // Convert file to base64 for serverless functions
      const reader = new FileReader();
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = () => reject(new Error('Failed to read file. Please try again.'));
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: fileBase64,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          format: 'table',
          scenarioTypes: 'functional,edge-case,negative',
          aiProvider: aiProvider,
        }),
      });

      // Get response text first to handle non-JSON responses
      let responseText: string;
      try {
        responseText = await response.text();
      } catch (e: any) {
        // Handle network errors (blocked by extension, CORS, etc.)
        if (e.message?.includes('blocked') || e.message?.includes('ERR_BLOCKED')) {
          throw new Error('Request was blocked by browser extension or security settings. Please disable ad blockers or privacy extensions and try again.');
        }
        if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')) {
          throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
        }
        throw new Error(`Network error: ${e.message || 'Unknown error occurred'}`);
      }
      
      if (!response.ok) {
        // Handle rate limiting (429) with user-friendly message
        if (response.status === 429) {
          let rateLimitMessage = "Slow down! You've reached the generation limit. Please wait a minute before trying again.";
          try {
            const errorData = JSON.parse(responseText);
            if (errorData.message) {
              rateLimitMessage = errorData.message;
            }
          } catch (e) {
            // Use default message if parsing fails
          }
          throw new Error(rateLimitMessage);
        }
        
        let errorMessage = 'Failed to generate test cases';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = responseText || `Server returned ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Parse JSON response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid response from server: ${responseText.substring(0, 100)}`);
      }
      
      // Store raw response for debugging/fallback
      setRawTestCases(data.testCases || null);
      
      // Debug: Log the raw response
      console.log('Raw test cases response:', data.testCases);
      console.log('Response length:', data.testCases?.length || 0);
      
      // Parse test cases from response
      const parsedTestCases = parseTestCases(data.testCases);
      console.log('Parsed test cases:', parsedTestCases);
      
      if (parsedTestCases.length === 0 && data.testCases && data.testCases.trim().length > 0) {
        // If parsing failed but we have content, create a fallback case with raw content
        console.warn('Parser returned empty, but we have test cases content. Creating fallback.');
        setTestCases([{
          id: 'tc-raw',
          title: 'Generated Test Cases (Raw Format)',
          type: 'functional',
          steps: data.testCases.split('\n').filter((l: string) => l.trim().length > 0).slice(0, 20),
          expectedResult: 'Review the generated test cases above',
          priority: 'High',
        }]);
      } else {
        setTestCases(parsedTestCases);
      }
      
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
      let errorMessage = err instanceof Error ? err.message : 'An error occurred';
      
      // Provide helpful messages for common errors
      if (errorMessage.includes('blocked') || errorMessage.includes('ERR_BLOCKED')) {
        errorMessage = 'Request blocked by browser extension. Please disable ad blockers or privacy extensions (like uBlock Origin, Privacy Badger) and try again.';
      } else if (errorMessage.includes('Network error') || errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection and try again.';
      } else if (errorMessage.includes('CORS')) {
        errorMessage = 'CORS error: Cross-origin request blocked. Please contact support if this persists.';
      }
      
      setError(errorMessage);
      setUploadedFile(null);
      console.error('Error generating test cases:', err);
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
    if (!testCasesString || typeof testCasesString !== 'string') {
      console.error('Invalid test cases string:', testCasesString);
      return [];
    }

    try {
      const lines = testCasesString.split('\n').filter(line => line.trim());
      const cases: TestCase[] = [];
      let inTable = false;
      let tableHeaderFound = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Detect markdown table headers (## Functional Test Cases, etc.)
        if (line.match(/^##\s+(Functional|Negative|Edge\s*Case|Security|UI\/UX)\s+Test\s+Cases?/i)) {
          inTable = true;
          tableHeaderFound = false;
          continue;
        }
        
        // Detect markdown table separator row (|---|---|---|---|---|---|)
        if (line.match(/^\|[\s\-:]+\|/)) {
          tableHeaderFound = true;
          continue;
        }
        
        // Parse markdown table rows
        if (inTable && line.match(/^\|/) && tableHeaderFound) {
          const cells = line.split('|').map(c => c.trim()).filter(c => c && !c.match(/^[-:]+$/));
          
          // Expected format: | ID | Title | Type | Steps | Expected Result | Priority |
          if (cells.length >= 6) {
            const [id, title, typeStr, stepsStr, expectedStr, priorityStr] = cells;
            
            // Only process rows that have a TC-ID
            if (id && id.match(/TC-[A-Z]+-\d+/i)) {
              // Extract TC-ID
              const tcId = id.trim();
              
              // Extract title
              const testTitle = title.trim() || `Test Case ${cases.length + 1}`;
              
              // Determine type from TC-ID or Type column
              let type: ScenarioType = 'functional';
              const lowerId = tcId.toLowerCase();
              const lowerType = typeStr ? typeStr.toLowerCase() : '';
              
              if (lowerId.includes('tc-func') || lowerType.includes('functional')) {
                type = 'functional';
              } else if (lowerId.includes('tc-neg') || lowerType.includes('negative')) {
                type = 'negative';
              } else if (lowerId.includes('tc-edge') || lowerType.includes('edge')) {
                type = 'edge-case';
              } else if (lowerId.includes('tc-sec') || lowerType.includes('security')) {
                type = 'functional'; // Map security to functional for display
              } else if (lowerId.includes('tc-ui') || lowerType.includes('ui')) {
                type = 'functional'; // Map UI/UX to functional for display
              }
              
              // Parse steps (handle <br> tags and numbered lists)
              let steps: string[] = [];
              if (stepsStr) {
                // Split by <br> tags first
                const stepParts = stepsStr.split(/<br\s*\/?>/i).map(s => s.trim()).filter(s => s.length > 0);
                
                // If no <br> tags, try splitting by numbered patterns (1., 2., etc.)
                if (stepParts.length === 1) {
                  steps = stepsStr.split(/(?=\d+\.\s)/).map(s => s.trim()).filter(s => s.length > 0);
                } else {
                  steps = stepParts;
                }
                
                // Clean up step text (remove leading numbers, bullets, etc.)
                steps = steps.map(step => {
                  return step.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, '').trim();
                }).filter(s => s.length > 0);
              }
              
              // Extract expected result
              const expectedResult = expectedStr ? expectedStr.trim() : 'Verify the expected behavior';
              
              // Determine priority
              let priority: 'High' | 'Medium' | 'Low' = 'Medium';
              if (priorityStr) {
                const lowerPriority = priorityStr.toLowerCase();
                if (lowerPriority.includes('high')) {
                  priority = 'High';
                } else if (lowerPriority.includes('low')) {
                  priority = 'Low';
                }
              }
              
              // Create test case
              const testCase: TestCase = {
                id: tcId,
                title: testTitle,
                type,
                steps: steps.length > 0 ? steps : ['No steps provided'],
                expectedResult,
                priority,
              };
              
              cases.push(testCase);
            }
          }
        }
      }
      
      // If we still have no cases but have content, try fallback parsing
      if (cases.length === 0 && testCasesString.length > 50) {
        console.warn('Markdown table parsing returned empty, trying fallback parser');
        // Try to find any TC-IDs in the text
        const tcIdMatches = testCasesString.match(/TC-[A-Z]+-\d+/gi);
        if (tcIdMatches && tcIdMatches.length > 0) {
          // Create basic cases from found TC-IDs
          tcIdMatches.forEach((tcId, idx) => {
            cases.push({
              id: tcId,
              title: `Test Case ${idx + 1}`,
              type: tcId.toLowerCase().includes('func') ? 'functional' : 
                    tcId.toLowerCase().includes('neg') ? 'negative' : 
                    tcId.toLowerCase().includes('edge') ? 'edge-case' : 'functional',
              steps: ['Steps to be extracted from raw content'],
              expectedResult: 'Verify the expected behavior based on the PRD requirements',
              priority: 'High',
            });
          });
        } else {
          // Last resort: create a single case with raw content
          return [{
            id: 'tc-1',
            title: 'Generated Test Case',
            type: 'functional',
            steps: testCasesString.split('\n').filter((l: string) => l.trim().length > 10).slice(0, 5),
            expectedResult: 'Verify the expected behavior based on the PRD requirements',
            priority: 'High',
          }];
        }
      }
      
      return cases;
    } catch (error) {
      console.error('Error parsing test cases:', error);
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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, count: null },
    { id: 'documents', label: 'Documents', icon: FolderOpen, count: totalDocuments },
    { id: 'test-cases', label: 'Test Cases', icon: FileCheck, count: totalTestCases },
    { id: 'messages', label: 'Messages', icon: MessageSquare, count: 0 },
    { id: 'settings', label: 'Settings', icon: Settings, count: null },
  ] as const;

  return (
    <div className="min-h-screen bg-zinc-900 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Sparkles className="text-blue-400" size={24} />
            <h1 className="text-xl font-semibold text-white">Test Case Generator</h1>
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
                    ? 'bg-gray-900 text-white font-medium border border-gray-800'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} />
                  <span>{item.label}</span>
                </div>
                {item.count !== null && item.count > 0 && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isActive ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300'
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
        <header className="bg-zinc-900 border-b border-zinc-800 px-8 py-4">
          <h2 className="text-2xl font-light text-white">
            {activeTab === 'dashboard' && 'AI Test Case Generator'}
            {activeTab === 'documents' && 'Documents'}
            {activeTab === 'test-cases' && 'Test Cases'}
            {activeTab === 'messages' && 'Messages'}
            {activeTab === 'settings' && 'Settings'}
          </h2>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-8 overflow-y-auto bg-zinc-900">
          {activeTab === 'dashboard' && (
            <div className="max-w-[1200px] mx-auto space-y-12">
              {/* Navigation */}
              <div className="flex items-center justify-between">
                <a
                  href="https://suneetmalhotra.com/tools"
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>← Back to Tools</span>
                </a>
                <a
                  href="https://github.com/SuneetMalhotra/ai-test-case-generator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white hover:bg-zinc-800 transition-colors"
                  aria-label="View on GitHub"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">GitHub</span>
                </a>
              </div>

              {/* Hero Section */}
              <div className="mb-16">
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-xs px-3 py-1 bg-zinc-800/50 text-cyan-400 rounded-full border border-cyan-500/20">AI-Powered</span>
                  <span className="text-xs px-3 py-1 bg-zinc-800/50 text-cyan-400 rounded-full border border-cyan-500/20">Test Automation</span>
                  <span className="text-xs px-3 py-1 bg-zinc-800/50 text-cyan-400 rounded-full border border-cyan-500/20">Quality Engineering</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
                  AI Test Case Generator
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-3xl prose prose-invert">
                  Transform Product Requirement Documents into comprehensive test suites using AI-powered analysis. 
                  A personal research project demonstrating modern quality engineering automation.
                </p>
              </div>

              {/* Video Showcase */}
              <div className="mb-20">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                  {/* Cyan/Blue outer glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 blur-2xl -z-10"></div>
                  
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-zinc-900 relative z-10">
                    <iframe
                      src="https://www.youtube.com/embed/KbnFXJtnUgc"
                      title="AI Test Case Generator Demo"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  </div>
                  
                  <p className="mt-6 text-center text-gray-400 text-sm md:text-base font-medium prose prose-invert">
                    Demo: Processing a 15-page PRD (Product Requirement Document) into a full test suite.
                  </p>
                </div>
              </div>

              {/* Technical Deep Dive - Bento Grid */}
              <div className="mb-20">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">AI Coverage Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {/* Card 1: Positive Paths */}
                  <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 rounded-xl p-6 hover:border-cyan-500/30 transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white">Positive Paths</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed prose prose-invert">
                      Focus on Happy Path validation and core business requirements. Ensures all primary user flows 
                      and expected behaviors are thoroughly tested.
                    </p>
                  </div>

                  {/* Card 2: Negative Testing */}
                  <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 rounded-xl p-6 hover:border-red-500/30 transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white">Negative Testing</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed prose prose-invert">
                      Comprehensive error handling, failure modes, and system robustness validation. Tests boundary 
                      conditions and invalid input scenarios.
                    </p>
                  </div>

                  {/* Card 3: Edge Cases */}
                  <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 rounded-xl p-6 hover:border-yellow-500/30 transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white">Edge Cases</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed prose prose-invert">
                      Boundary conditions and rare user behaviors. Identifies potential issues at the limits of system 
                      capabilities and unusual but valid inputs.
                    </p>
                  </div>

                  {/* Card 4: Process Card (Wider) */}
                  <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 backdrop-blur-md border border-cyan-500/20 rounded-xl p-8 hover:border-cyan-500/40 transition-all duration-300">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-3">Workflow Process</h3>
                        <p className="text-gray-300 leading-relaxed text-lg prose prose-invert">
                          <strong className="text-cyan-400">Ingests PDF PRDs</strong> → <strong className="text-cyan-400">Contextual AI Analysis</strong> → <strong className="text-cyan-400">Structured Jira/CSV Export</strong>
                        </p>
                        <p className="text-gray-400 mt-4 leading-relaxed prose prose-invert">
                          The system processes requirement documents through advanced AI analysis, extracting key functional 
                          requirements, edge cases, and security considerations. Output is formatted for direct import into 
                          test management tools like Jira, Zephyr, or TestRail.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Generator Section */}
              <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 rounded-xl p-8 mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">Generate Test Cases</h3>

                {/* AI Provider Toggle */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    AI Provider
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setAiProvider('gemini')}
                      disabled={isGenerating}
                      className={`flex-1 px-6 py-3 rounded-lg border-2 transition-all ${
                        aiProvider === 'gemini'
                          ? 'border-cyan-400 bg-zinc-800 text-white font-medium'
                          : 'border-zinc-700 bg-zinc-900 text-gray-400 hover:border-zinc-600 hover:text-gray-300'
                      } ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Sparkles size={18} />
                        <span>Google Gemini</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setAiProvider('ollama')}
                      disabled={isGenerating}
                      className={`flex-1 px-6 py-3 rounded-lg border-2 transition-all ${
                        aiProvider === 'ollama'
                          ? 'border-cyan-400 bg-zinc-800 text-white font-medium'
                          : 'border-zinc-700 bg-zinc-900 text-gray-400 hover:border-zinc-600 hover:text-gray-300'
                      } ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Brain size={18} />
                        <span>Ollama (Local)</span>
                      </div>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {aiProvider === 'gemini' 
                      ? 'Using Google Gemini Pro for cloud-based AI generation'
                      : 'Using local Ollama instance (requires Ollama running on your machine)'}
                  </p>
                </div>

                {/* Upload Zone */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
                    isDragActive
                      ? 'border-cyan-400 bg-zinc-800/50'
                      : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/30'
                  } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input {...getInputProps()} />
                  {isGenerating ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="animate-spin text-cyan-400 mb-4" size={48} />
                      <p className="text-lg font-medium text-white">Generating test cases...</p>
                      <p className="text-sm text-gray-400 mt-2">
                        AI is analyzing your document and creating scenarios
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="bg-zinc-800 border border-zinc-700 rounded-full p-4 mb-4">
                        <Upload className="text-cyan-400" size={32} />
                      </div>
                      <p className="text-lg font-medium text-white mb-2">
                        {isDragActive ? 'Drop your PRD here' : 'Drag & drop your PRD file here'}
                      </p>
                      <p className="text-sm text-gray-400 mb-4">or click to browse</p>
                      <p className="text-xs text-gray-500">
                        Supports PDF, Markdown, and Text files (max 5MB)
                      </p>
                    </div>
                  )}
                </div>

                {uploadedFile && !isGenerating && (
                  <div className="mt-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="text-cyan-400" size={20} />
                      <span className="text-sm text-gray-300">{uploadedFile.name}</span>
                    </div>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="text-gray-500 hover:text-gray-300"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-3">
                    <AlertCircle className="text-red-400" size={20} />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}
              </div>

              {/* H1B-Compliant CTA */}
              <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-8 md:p-12 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Professional Networking & Demos</h2>
                <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto leading-relaxed prose prose-invert">
                  This tool is a personal research project. I am available for professional knowledge sharing and 
                  technical demonstrations upon request.
                </p>
                <a
                  href="https://suneetmalhotra.com/contact?subject=Networking"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-violet-600 transition-all duration-300 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
                >
                  Request a Technical Deep-Dive
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="max-w-6xl mx-auto">
              {totalDocuments === 0 ? (
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-12 text-center">
                  <FolderOpen className="mx-auto text-gray-600 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-white mb-2">No Documents Yet</h3>
                  <p className="text-gray-400 mb-6">Upload your first PRD to get started</p>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
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
                      className="bg-gray-900 rounded-lg border border-gray-800 p-6 flex items-center justify-between hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-gray-800 rounded-lg p-3 border border-gray-800">
                          <FileText className="text-blue-400" size={24} />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{doc.name}</h3>
                          <p className="text-sm text-gray-400">
                            {doc.testCasesCount} test cases • {doc.uploadedAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-blue-400 transition-colors">
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
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-12 text-center">
                  <FileCheck className="mx-auto text-gray-600 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-white mb-2">No Test Cases Yet</h3>
                  <p className="text-gray-400 mb-6">Generate test cases from your PRD documents</p>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Plus size={20} />
                    Generate Test Cases
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-light text-white">
                      {totalTestCases} Test Cases Generated
                    </h3>
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Download size={18} />
                      Export CSV
                    </button>
                  </div>

                  <div className="space-y-4">
                    {testCases.map((testCase) => (
                      <div
                        key={testCase.id}
                        className="bg-gray-900 rounded-lg border border-gray-800 p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-medium text-white mb-1">{testCase.title}</h4>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                testCase.type === 'functional'
                                  ? 'bg-blue-900/30 text-blue-400 border border-blue-800'
                                  : testCase.type === 'edge-case'
                                  ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
                                  : 'bg-red-900/30 text-red-400 border border-red-800'
                              }`}>
                                {testCase.type.replace('-', ' ').toUpperCase()}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                testCase.priority === 'High'
                                  ? 'bg-red-900/30 text-red-400 border border-red-800'
                                  : testCase.priority === 'Medium'
                                  ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
                                  : 'bg-gray-800 text-gray-400 border border-gray-700'
                              }`}>
                                {testCase.priority} Priority
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <h5 className="text-sm font-medium text-gray-400 mb-2">Steps:</h5>
                            {testCase.steps && testCase.steps.length > 0 ? (
                              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
                                {testCase.steps.map((step, idx) => (
                                  <li key={idx}>{step}</li>
                                ))}
                              </ol>
                            ) : (
                              <p className="text-sm text-gray-500 italic">No steps provided</p>
                            )}
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-gray-400 mb-1">Expected Result:</h5>
                            <p className="text-sm text-gray-300">{testCase.expectedResult || 'Not specified'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Show raw content if parsing failed */}
                    {rawTestCases && testCases.length === 0 && (
                      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                        <h4 className="font-medium text-white mb-4">Raw Generated Content</h4>
                        <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-gray-800 p-4 rounded border border-gray-700 max-h-96 overflow-y-auto">
                          {rawTestCases}
                        </pre>
                        <p className="text-xs text-gray-500 mt-2">Note: Unable to parse test cases. Showing raw LLM output.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="max-w-6xl mx-auto">
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-12 text-center">
                <MessageSquare className="mx-auto text-gray-600 mb-4" size={48} />
                <h3 className="text-lg font-medium text-white mb-2">No Messages</h3>
                <p className="text-gray-400">Messages feature coming soon</p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-8">
                <h3 className="text-xl font-light text-white mb-6">Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Default AI Provider
                    </label>
                    <select
                      value={aiProvider}
                      onChange={(e) => setAiProvider(e.target.value as AIProvider)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    >
                      <option value="ollama">Ollama (Local LLM)</option>
                      <option value="openai">OpenAI (GPT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Export Format
                    </label>
                    <select className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
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


