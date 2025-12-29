/**
 * LLM Client abstraction
 * Supports both OpenAI and Ollama
 */
import OpenAI from 'openai';
import axios from 'axios';
import { logger } from '../../utils/logger';
export class LLMClient {
    openai = null;
    config;
    constructor(config) {
        this.config = config;
        if (config.provider === 'openai' && config.apiKey) {
            this.openai = new OpenAI({ apiKey: config.apiKey });
            logger.info('Initialized OpenAI client');
        }
        else if (config.provider === 'ollama') {
            logger.info('Using Ollama provider');
        }
        else {
            throw new Error('Invalid LLM configuration');
        }
    }
    async chat(messages) {
        if (this.config.provider === 'openai' && this.openai) {
            return this.chatOpenAI(messages);
        }
        else if (this.config.provider === 'ollama') {
            return this.chatOllama(messages);
        }
        throw new Error('No LLM provider configured');
    }
    async chatOpenAI(messages) {
        if (!this.openai)
            throw new Error('OpenAI client not initialized');
        const response = await this.openai.chat.completions.create({
            model: this.config.model,
            messages: messages,
            temperature: this.config.temperature ?? 0.2,
            max_tokens: this.config.maxTokens ?? 2000,
        });
        return response.choices[0]?.message?.content || '';
    }
    async chatOllama(messages) {
        const baseURL = this.config.baseURL || 'http://localhost:11434';
        const url = `${baseURL}/api/chat`;
        const response = await axios.post(url, {
            model: this.config.model,
            messages,
            stream: false,
            options: {
                temperature: this.config.temperature ?? 0.2,
            },
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000,
        });
        return response.data.message?.content || '';
    }
}
//# sourceMappingURL=client.js.map