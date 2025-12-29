import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const useOpenAI = !!OPENAI_API_KEY;
    const useGemini = !!GEMINI_API_KEY && !useOpenAI;
    const useOllama = !useOpenAI && !useGemini;

    let ollamaStatus = {
      available: false,
      host: OLLAMA_HOST,
      model: OLLAMA_MODEL,
      modelAvailable: false,
    };

    // Check Ollama if no cloud API keys are set
    if (useOllama) {
      try {
        const response = await axios.get(`${OLLAMA_HOST}/api/tags`, { timeout: 5000 });
        const models = response.data.models || [];
        const modelAvailable = models.some((m: any) => m.name.includes(OLLAMA_MODEL.split(':')[0]));

        ollamaStatus = {
          available: true,
          host: OLLAMA_HOST,
          model: OLLAMA_MODEL,
          modelAvailable,
        };
      } catch (error) {
        ollamaStatus = {
          available: false,
          host: OLLAMA_HOST,
          model: OLLAMA_MODEL,
          modelAvailable: false,
        };
      }
    }

    return res.status(200).json({
      status: 'healthy',
      aiProvider: useOpenAI ? 'openai' : useGemini ? 'gemini' : 'ollama',
      ollama: ollamaStatus,
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
