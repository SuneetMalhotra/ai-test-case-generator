import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 60,
};

import { OpenAI } from 'openai';
import axios from 'axios';
// @ts-ignore - pdf-parse has ESM export issues
import pdfParse from 'pdf-parse';
import { Buffer } from 'buffer';

// Hybrid AI Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';

// Determine which AI provider to use
const useOpenAI = !!OPENAI_API_KEY;
const useGemini = !!GEMINI_API_KEY && !useOpenAI;
const useOllama = !useOpenAI && !useGemini;

/**
 * Extract text from PDF buffer
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await (pdfParse as any)(buffer);
    return data.text;
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate test cases using hybrid AI (OpenAI, Gemini, or Ollama)
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

  // Use OpenAI if API key is available
  if (useOpenAI && OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cost-effective model for Vercel
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 4000,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI API error:', error);
      // Fallback to Ollama if OpenAI fails
      if (useOllama) {
        return generateWithOllama(prdContent, format, scenarioTypes, systemPrompt, userPrompt);
      }
      throw error;
    }
  }

  // Use Gemini if API key is available
  if (useGemini && GEMINI_API_KEY) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\n${userPrompt}`
            }]
          }]
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 120000,
        }
      );

      return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      console.error('Gemini API error:', error);
      // Fallback to Ollama if Gemini fails
      if (useOllama) {
        return generateWithOllama(prdContent, format, scenarioTypes, systemPrompt, userPrompt);
      }
      throw error;
    }
  }

  // Fallback to Ollama (local development)
  return generateWithOllama(prdContent, format, scenarioTypes, systemPrompt, userPrompt);
}

/**
 * Generate test cases using Ollama (local fallback)
 */
async function generateWithOllama(
  prdContent: string,
  format: 'table' | 'gherkin',
  scenarioTypes: string | undefined,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  try {
    const response = await axios.post(
      `${OLLAMA_HOST}/api/chat`,
      {
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
        options: {
          temperature: 0.2,
          top_p: 0.9,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000,
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as any;
    const format = (body.format as 'table' | 'gherkin') || 'table';
    const scenarioTypes = body.scenarioTypes || 'functional,edge-case,negative';
    let prdContent: string;
    let fileName = body.fileName || 'uploaded-file';
    let fileSize = body.fileSize || 0;

    // Handle base64 encoded file (from frontend)
    if (body.file && typeof body.file === 'string' && body.file.startsWith('data:')) {
      const base64Data = body.file.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      fileSize = buffer.length;
      const mimeType = body.file.split(';')[0].split(':')[1];

      if (mimeType === 'application/pdf') {
        prdContent = await extractTextFromPDF(buffer);
      } else {
        prdContent = buffer.toString('utf-8');
      }
    } else if (body.content) {
      // Direct text content
      prdContent = body.content;
      fileSize = prdContent.length;
    } else {
      return res.status(400).json({ error: 'No file or content provided' });
    }

    // Generate test cases
    const testCases = await generateTestCases(prdContent, format, scenarioTypes);

    console.log('Generated test cases length:', testCases.length);
    console.log('AI Provider used:', useOpenAI ? 'OpenAI' : useGemini ? 'Gemini' : 'Ollama');

    return res.status(200).json({
      success: true,
      testCases,
      format,
      metadata: {
        fileName,
        fileSize,
        extractedLength: prdContent.length,
        aiProvider: useOpenAI ? 'openai' : useGemini ? 'gemini' : 'ollama',
      },
    });
  } catch (error) {
    console.error('Error generating test cases:', error);
    return res.status(500).json({
      error: 'Failed to generate test cases',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
