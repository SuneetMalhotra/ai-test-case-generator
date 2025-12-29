/**
 * Core Parsers
 * Base parser utilities and interfaces
 */
export class BaseParser {
    validate(content) {
        if (!content || content.trim().length === 0) {
            throw new Error('Content cannot be empty');
        }
    }
}
//# sourceMappingURL=index.js.map