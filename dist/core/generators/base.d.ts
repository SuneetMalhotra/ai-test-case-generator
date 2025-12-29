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
export declare abstract class BaseGenerator {
    protected llmClient: LLMClient;
    constructor(llmClient: LLMClient);
    abstract generate(requirements: string, options: GeneratorOptions): Promise<string>;
    protected buildSystemPrompt(options: GeneratorOptions): string;
}
//# sourceMappingURL=base.d.ts.map