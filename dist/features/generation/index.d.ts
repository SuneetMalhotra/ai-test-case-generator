/**
 * Test Case Generation Feature
 * Main generator that orchestrates the test creation process
 */
import { LLMConfig } from '../../core/llm/client';
export interface GenerationOptions {
    framework?: 'playwright' | 'jest' | 'cypress';
    language?: 'typescript' | 'javascript';
    includeComments?: boolean;
}
export declare class TestCaseGenerator {
    private llmClient;
    constructor(config?: Partial<LLMConfig>);
    generateFromPRD(prdContent: string, options?: GenerationOptions): Promise<string>;
    generateFromGherkin(gherkinContent: string, options?: GenerationOptions): Promise<string>;
    private buildPRDPrompt;
    private buildGherkinPrompt;
}
//# sourceMappingURL=index.d.ts.map