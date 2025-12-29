/**
 * Test Case Generation Feature
 * Main generator that orchestrates the test creation process
 */

import { LLMClient, LLMConfig } from '../../core/llm/client';
import { logger } from '../../utils/logger';

export interface GenerationOptions {
  framework?: 'playwright' | 'jest' | 'cypress';
  language?: 'typescript' | 'javascript';
  includeComments?: boolean;
}

export class TestCaseGenerator {
  private llmClient: LLMClient;

  constructor(config?: Partial<LLMConfig>) {
    const defaultConfig: LLMConfig = {
      provider: (process.env.OLLAMA_HOST ? 'ollama' : 'openai') as 'openai' | 'ollama',
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OLLAMA_HOST || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || process.env.OPENAI_MODEL || 'gpt-4',
      temperature: parseFloat(process.env.TEMPERATURE || '0.2'),
      maxTokens: parseInt(process.env.MAX_TOKENS || '2000'),
      ...config,
    };

    this.llmClient = new LLMClient(defaultConfig);
    logger.info('TestCaseGenerator initialized');
  }

  async generateFromPRD(prdContent: string, options?: GenerationOptions): Promise<string> {
    logger.info('Generating test cases from PRD...');

    const prompt = this.buildPRDPrompt(prdContent, options);
    const testCases = await this.llmClient.chat([
      {
        role: 'system',
        content: 'You are an expert QA engineer specializing in test case generation. Generate comprehensive, executable test cases.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    return testCases;
  }

  async generateFromGherkin(gherkinContent: string, options?: GenerationOptions): Promise<string> {
    logger.info('Generating test cases from Gherkin...');

    const prompt = this.buildGherkinPrompt(gherkinContent, options);
    const testCases = await this.llmClient.chat([
      {
        role: 'system',
        content: 'You are an expert QA engineer. Convert Gherkin scenarios into executable test code.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    return testCases;
  }

  private buildPRDPrompt(prdContent: string, options?: GenerationOptions): string {
    const framework = options?.framework || 'playwright';
    const language = options?.language || 'typescript';
    const includeComments = options?.includeComments ?? true;

    return `Generate comprehensive test cases from the following PRD:

${prdContent}

Requirements:
- Framework: ${framework}
- Language: ${language}
- Include comments: ${includeComments}
- Generate positive and negative test cases
- Include edge cases
- Use best practices for ${framework}

Return only the test code, no explanations.`;
  }

  private buildGherkinPrompt(gherkinContent: string, options?: GenerationOptions): string {
    const framework = options?.framework || 'playwright';
    const language = options?.language || 'typescript';

    return `Convert the following Gherkin scenarios into ${framework} test code (${language}):

${gherkinContent}

Requirements:
- Use proper ${framework} APIs
- Follow ${framework} best practices
- Include proper assertions
- Handle async operations correctly

Return only the test code.`;
  }
}

