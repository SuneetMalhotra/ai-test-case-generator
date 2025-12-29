/**
 * Base Test Generator
 * Abstract base class for framework-specific generators
 */

import { LLMClient } from '../llm/client';

export interface GeneratorOptions {
  framework: 'playwright' | 'jest' | 'cypress';
  language: 'typescript' | 'javascript';
  includeComments?: boolean;
}

export abstract class BaseGenerator {
  protected llmClient: LLMClient;

  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
  }

  abstract generate(requirements: string, options: GeneratorOptions): Promise<string>;

  protected buildSystemPrompt(options: GeneratorOptions): string {
    return `You are an expert QA engineer specializing in ${options.framework} test automation.
Generate comprehensive, production-ready test code in ${options.language}.
Follow ${options.framework} best practices and include proper error handling.`;
  }
}

