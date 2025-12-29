/**
 * Gherkin Parser
 * Parses Gherkin feature files
 */
export interface GherkinScenario {
    name: string;
    steps: GherkinStep[];
    tags?: string[];
}
export interface GherkinStep {
    keyword: 'Given' | 'When' | 'Then' | 'And' | 'But';
    text: string;
}
export declare class GherkinParser {
    parse(content: string): GherkinScenario[];
}
//# sourceMappingURL=parser.d.ts.map