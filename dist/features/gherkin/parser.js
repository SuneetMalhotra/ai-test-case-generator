/**
 * Gherkin Parser
 * Parses Gherkin feature files
 */
import { logger } from '../../utils/logger';
import { ParserError } from '../../utils/errors';
export class GherkinParser {
    parse(content) {
        logger.info('Parsing Gherkin content...');
        try {
            const scenarios = [];
            const lines = content.split('\n');
            let currentScenario = null;
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('Scenario:')) {
                    if (currentScenario) {
                        scenarios.push(currentScenario);
                    }
                    currentScenario = {
                        name: trimmed.replace('Scenario:', '').trim(),
                        steps: [],
                    };
                }
                else if (trimmed.startsWith('Scenario Outline:')) {
                    if (currentScenario) {
                        scenarios.push(currentScenario);
                    }
                    currentScenario = {
                        name: trimmed.replace('Scenario Outline:', '').trim(),
                        steps: [],
                    };
                }
                else if (currentScenario && /^(Given|When|Then|And|But)\s+/.test(trimmed)) {
                    const match = trimmed.match(/^(Given|When|Then|And|But)\s+(.+)/);
                    if (match) {
                        currentScenario.steps.push({
                            keyword: match[1],
                            text: match[2],
                        });
                    }
                }
            }
            if (currentScenario) {
                scenarios.push(currentScenario);
            }
            return scenarios;
        }
        catch (error) {
            throw new ParserError('Failed to parse Gherkin', error instanceof Error ? error.message : String(error));
        }
    }
}
//# sourceMappingURL=parser.js.map