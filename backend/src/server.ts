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
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

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
  format: 'table' | 'gherkin'
): Promise<string> {
  const systemPrompt = `You are an expert QA Architect with 20+ years of experience. Your task is to analyze Product Requirement Documents (PRDs) and generate comprehensive, executable test cases.

Generate test cases with the following structure:
- Test ID (unique identifier)
- Title (clear, descriptive test case name)
- Steps (detailed step-by-step instructions)
- Expected Result (what should happen)
- Priority (High/Medium/Low based on business impact)

Focus on:
- Functional test cases
- Edge cases
- Negative test scenarios
- Boundary conditions
- Integration points`;

  const formatInstructions = format === 'table'
    ? `Format the output as a structured table with columns: ID, Title, Steps, Expected Result, Priority.`
    : `Format the output as Gherkin (BDD) scenarios with Given-When-Then syntax. Include Feature, Scenario, Given, When, Then, And, But keywords.`;

  const userPrompt = `Analyze the following PRD and generate comprehensive test cases in ${format === 'table' ? 'table format' : 'Gherkin BDD format'}:

${prdContent}

${formatInstructions}

Generate at least 10-15 test cases covering all major features and edge cases.`;

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
    const testCases = await generateTestCases(prdContent, format);

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

// Serve frontend in production
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 Ollama configured: ${OLLAMA_HOST} (model: ${OLLAMA_MODEL})`);
});
