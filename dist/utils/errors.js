/**
 * Custom error classes
 */
export class TestGenerationError extends Error {
    cause;
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = 'TestGenerationError';
    }
}
export class ParserError extends Error {
    source;
    constructor(message, source) {
        super(message);
        this.source = source;
        this.name = 'ParserError';
    }
}
export class ValidationError extends Error {
    field;
    constructor(message, field) {
        super(message);
        this.field = field;
        this.name = 'ValidationError';
    }
}
//# sourceMappingURL=errors.js.map