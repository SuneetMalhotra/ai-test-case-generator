/**
 * Base Test Generator
 * Abstract base class for framework-specific generators
 */
export class BaseGenerator {
    llmClient;
    constructor(llmClient) {
        this.llmClient = llmClient;
    }
    buildSystemPrompt(options) {
        return `You are an expert QA engineer specializing in ${options.framework} test automation.
Generate comprehensive, production-ready test code in ${options.language}.
Follow ${options.framework} best practices and include proper error handling.`;
    }
}
//# sourceMappingURL=base.js.map