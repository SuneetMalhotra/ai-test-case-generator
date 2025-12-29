/**
 * LLM Client abstraction
 * Supports both OpenAI and Ollama
 */
export interface LLMConfig {
    provider: 'openai' | 'ollama';
    apiKey?: string;
    baseURL?: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
}
export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export declare class LLMClient {
    private openai;
    private config;
    constructor(config: LLMConfig);
    chat(messages: LLMMessage[]): Promise<string>;
    private chatOpenAI;
    private chatOllama;
}
//# sourceMappingURL=client.d.ts.map