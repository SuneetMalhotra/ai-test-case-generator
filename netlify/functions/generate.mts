import axios from 'axios';
// @ts-ignore - pdf-parse has ESM export issues
import * as pdfParseModule from 'pdf-parse';
const pdfParse = (pdfParseModule as any).default || pdfParseModule;
import { Buffer } from 'buffer';

// AI Configuration - Gemini with Ollama fallback
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';
const ACCESS_PASSWORD = (process.env.ACCESS_PASSWORD || 'demo2024').trim(); // Default password, change in Netlify env vars

// Simple in-memory rate limiting (resets on function restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_HOUR = 1; // 1 free generation per hour per IP

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

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

// Track which provider was used (for metadata)
let lastUsedProvider: 'gemini' | 'ollama' = 'gemini';

/**
 * Generate test cases using Gemini with Ollama fallback
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

  // Try Gemini first, fallback to Ollama if Gemini fails or is not configured
  if (GEMINI_API_KEY) {
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

      const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (generatedText) {
        lastUsedProvider = 'gemini';
        return generatedText;
      }
      
      // If empty response, fall through to Ollama
      console.warn('Gemini returned empty response, falling back to Ollama');
    } catch (error: any) {
      console.error('Gemini API error, falling back to Ollama:', error.message);
      
      // For certain errors, don't fallback (like invalid API key)
      if (error.response?.status === 401) {
        throw new Error('Invalid Gemini API key. Please check your GEMINI_API_KEY in Netlify environment variables.');
      }
      
      // For other errors, fall through to Ollama fallback
    }
  }

  // Fallback to Ollama (local development or when Gemini fails)
  console.log('Using Ollama fallback:', OLLAMA_HOST);
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

    const generatedText = response.data.message?.content || '';
    
    if (!generatedText) {
      throw new Error('Ollama returned empty response. Check if the model is loaded.');
    }

    lastUsedProvider = 'ollama';
    return generatedText;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(`Model "${OLLAMA_MODEL}" not found. Please run: ollama pull ${OLLAMA_MODEL}. Available models: Check with "ollama list"`);
      }
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error(`Cannot connect to Ollama at ${OLLAMA_HOST}. Is Ollama running? For local development, start Ollama with: ollama serve`);
      }
      throw new Error(`Ollama API error: ${error.message}. Is Ollama running at ${OLLAMA_HOST}?`);
    }
    throw error;
  }
}

/**
 * Check rate limit for IP address
 */
function checkRateLimit(clientIp: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(clientIp);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (userLimit.count >= MAX_REQUESTS_PER_HOUR) {
    const minutesLeft = Math.ceil((userLimit.resetTime - now) / (60 * 1000));
    return {
      allowed: false,
      message: `Rate limit exceeded. You have used your free generation. Please wait ${minutesLeft} minute(s) before trying again.`
    };
  }

  userLimit.count++;
  return { allowed: true };
}

export const handler = async (event: any, context: any) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    
    // Password protection check
    const providedPassword = (body.password || event.headers['x-access-password'] || '').trim();
    const expectedPassword = ACCESS_PASSWORD.trim();
    
    console.log('Password check - provided:', providedPassword ? '***' : '(empty)', 'expected:', expectedPassword ? '***' : '(empty)');
    
    if (!providedPassword || providedPassword !== expectedPassword) {
      return {
        statusCode: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Unauthorized',
          message: `Invalid access password. Please provide the correct password to use this service. (Expected: ${expectedPassword ? '***' : 'not set'}, Got: ${providedPassword ? '***' : 'empty'})`,
        }),
      };
    }

    // Rate limiting check
    const clientIp = event.headers['x-forwarded-for']?.split(',')[0] || 
                     event.headers['x-nf-client-connection-ip'] || 
                     event.requestContext?.identity?.sourceIp || 
                     'unknown';
    
    const rateLimitCheck = checkRateLimit(clientIp);
    if (!rateLimitCheck.allowed) {
      return {
        statusCode: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Rate limit exceeded',
          message: rateLimitCheck.message || 'Too many requests. Please try again later.',
        }),
      };
    }
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
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'No file or content provided' }),
      };
    }

    // Generate test cases
    const testCases = await generateTestCases(prdContent, format, scenarioTypes);
    
    console.log('Generated test cases length:', testCases.length);
    console.log('AI Provider used:', lastUsedProvider);

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        testCases,
        format,
        metadata: {
          fileName,
          fileSize,
          extractedLength: prdContent.length,
          aiProvider: lastUsedProvider,
        },
      }),
    };
  } catch (error) {
    console.error('Error generating test cases:', error);
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Failed to generate test cases',
        message: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};
