/**
 * Express server for AI Test Case Generator
 * Handles file uploads and Ollama API integration
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios';
import pdfParse from 'pdf-parse';
import { Buffer } from 'buffer';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
// Use llama3.1:8b for Railway (smaller, faster, cheaper) or gpt-oss:20b for local
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || (process.env.NODE_ENV === 'production' ? 'llama3.1:8b' : 'gpt-oss:20b');

// Middleware
app.use(cors());
app.use(express.json());
// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  
  // Handle React Router - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
    }
  });
}

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'text/markdown', 'text/plain'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Markdown files are allowed.'));
    }
  },
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(Buffer.from(dataBuffer));
    return data.text;
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract text from Markdown file
 */
async function extractTextFromMarkdown(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read Markdown file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate test cases using Ollama
 */
async function generateTestCases(
  prdContent: string,
  format: 'table' | 'gherkin',
  scenarioTypes?: string
): Promise<string> {
  const types = scenarioTypes ? scenarioTypes.split(',').map(t => t.trim()) : ['functional', 'edge-case', 'negative'];
  
  const systemPrompt = `You are a Principal SDET with 20+ years of experience. Your task is to analyze Product Requirement Documents (PRDs) and generate a comprehensive Test Suite.

### Output Requirements:
1. **Grouping:** Group test cases by Type (Functional, Negative, Edge Case, Security, UI/UX).
2. **Priority:** Assign High/Medium/Low based on business risk and impact.
3. **Format:** Use Markdown Tables for each group with these exact columns:
   | ID | Title | Type | Steps | Expected Result | Priority |
4. **Detail Level:** 
   - Use bullet points or numbered lists within the "Steps" column for readability.
   - "Expected Result" must be assertive (e.g., "Verify...", "System must...", "User should...").
   - Include TC-IDs following naming convention: \`TC-[Category]-[Number]\` (e.g., TC-FUNC-001, TC-NEG-001, TC-EDGE-001, TC-SEC-001, TC-UI-001).

### Test Case Categories:
- **FUNCTIONAL:** Verify core functionality works as specified in the PRD
- **NEGATIVE:** Verify proper error handling, validation, and rejection of invalid inputs
- **EDGE CASE:** Test boundary conditions, maximum/minimum values, and unusual but valid inputs
- **SECURITY:** Test authentication, authorization, data protection, and security vulnerabilities
- **UI/UX:** Test user interface elements, accessibility, responsiveness, and user experience flows

### Formatting Rules:
- If steps are long, use clear numbered lists or bullet points within the table cell
- Each test case must be complete and executable
- Expected results must be specific and measurable
- Priority should reflect business risk (High = critical path, Medium = important features, Low = nice-to-have)`;

  const formatInstructions = format === 'table'
    ? `Format the output as Markdown tables grouped by Type. Each group should have a header like "## Functional Test Cases" followed by a table with columns: | ID | Title | Type | Steps | Expected Result | Priority |. Use bullet points or numbered lists within the Steps column for readability.`
    : `Format the output as Gherkin (BDD) scenarios with Given-When-Then syntax. Include Feature, Scenario, Given, When, Then, And, But keywords. Group scenarios by type (Functional, Negative, Edge Case, Security, UI/UX).`;

  const scenarioTypeInstructions = types.map(type => {
    if (type === 'functional') {
      return 'FUNCTIONAL: Generate 5-10 test cases that verify core functionality works as specified in the PRD. Use TC-FUNC-001, TC-FUNC-002, etc.';
    } else if (type === 'edge-case') {
      return 'EDGE CASE: Generate 3-7 test cases for boundary conditions, maximum/minimum values, and unusual but valid inputs. Use TC-EDGE-001, TC-EDGE-002, etc.';
    } else if (type === 'negative') {
      return 'NEGATIVE: Generate 3-7 test cases that verify proper error handling, validation, and rejection of invalid inputs. Use TC-NEG-001, TC-NEG-002, etc.';
    }
    return '';
  }).filter(Boolean).join('\n') + '\n\nAdditionally, generate:\n- SECURITY: 2-5 test cases for authentication, authorization, and data protection (TC-SEC-001, etc.)\n- UI/UX: 2-5 test cases for user interface, accessibility, and user experience (TC-UI-001, etc.)';

  const userPrompt = `Analyze the following PRD and generate a comprehensive Test Suite:

${prdContent}

${formatInstructions}

${scenarioTypeInstructions}

### Critical Requirements:
- Generate test cases organized by Type (Functional, Negative, Edge Case, Security, UI/UX)
- Use Markdown table format with exact columns: | ID | Title | Type | Steps | Expected Result | Priority |
- TC-IDs must follow convention: TC-[Category]-[Number]
- Steps should use bullet points or numbered lists for clarity
- Expected Results must be assertive and specific
- Priority should reflect business risk (High/Medium/Low)
- Ensure comprehensive coverage of all PRD requirements`;

  try {
    const response = await axios.post(
      `${OLLAMA_HOST}/api/chat`,
      {
        model: OLLAMA_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        stream: false,
        options: {
          temperature: 0.2,
          top_p: 0.9,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000, // 2 minute timeout for large documents
      }
    );

    return response.data.message?.content || '';
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(`Model "${OLLAMA_MODEL}" not found. Please run: ollama pull ${OLLAMA_MODEL}. Available models: Check with "ollama list"`);
      }
      throw new Error(`Ollama API error: ${error.message}. Is Ollama running at ${OLLAMA_HOST}?`);
    }
    throw error;
  }
}

/**
 * POST /api/generate
 * Accepts PRD file and generates test cases
 */
app.post('/api/generate', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const format = (req.body.format as 'table' | 'gherkin') || 'table';
    const scenarioTypes = req.body.scenarioTypes || 'functional,edge-case,negative';
    const filePath = req.file.path;
    const fileMime = req.file.mimetype;

    // Extract text from file
    let prdContent: string;
    if (fileMime === 'application/pdf') {
      prdContent = await extractTextFromPDF(filePath);
    } else {
      prdContent = await extractTextFromMarkdown(filePath);
    }

    // Clean up uploaded file
    await fs.unlink(filePath).catch(console.error);

    // Generate test cases
    const testCases = await generateTestCases(prdContent, format, scenarioTypes);
    
    // Debug logging
    console.log('Generated test cases length:', testCases.length);
    console.log('First 500 chars of test cases:', testCases.substring(0, 500));
    if (!testCases || testCases.trim().length === 0) {
      console.error('WARNING: Generated test cases is empty!');
      console.log('PRD content length:', prdContent.length);
      console.log('PRD content preview:', prdContent.substring(0, 200));
    }

    res.json({
      success: true,
      testCases,
      format,
      metadata: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        extractedLength: prdContent.length,
      },
    });
  } catch (error) {
    console.error('Error generating test cases:', error);
    res.status(500).json({
      error: 'Failed to generate test cases',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', async (req, res) => {
  try {
    // Check if Ollama is available
    const response = await axios.get(`${OLLAMA_HOST}/api/tags`, { timeout: 5000 });
    const models = response.data.models || [];
    const modelAvailable = models.some((m: any) => m.name.includes(OLLAMA_MODEL.split(':')[0]));

    res.json({
      status: 'healthy',
      ollama: {
        available: true,
        host: OLLAMA_HOST,
        model: OLLAMA_MODEL,
        modelAvailable,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      ollama: {
        available: false,
        host: OLLAMA_HOST,
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }
});

// Serve frontend in production (catch-all for React Router)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 Ollama configured: ${OLLAMA_HOST} (model: ${OLLAMA_MODEL})`);
  console.log(`🌐 Health check available at: http://localhost:${PORT}/api/health`);
});


