/**
 * Requirement Parser
 * Parses PRDs and product requirements documents
 */
export interface ParsedRequirement {
    title: string;
    description: string;
    acceptanceCriteria: string[];
    userStories?: string[];
}
export declare class RequirementParser {
    parsePRD(content: string): ParsedRequirement[];
    private extractAcceptanceCriteria;
}
//# sourceMappingURL=parser.d.ts.map