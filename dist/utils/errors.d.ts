/**
 * Custom error classes
 */
export declare class TestGenerationError extends Error {
    cause?: Error | undefined;
    constructor(message: string, cause?: Error | undefined);
}
export declare class ParserError extends Error {
    source?: string | undefined;
    constructor(message: string, source?: string | undefined);
}
export declare class ValidationError extends Error {
    field?: string | undefined;
    constructor(message: string, field?: string | undefined);
}
//# sourceMappingURL=errors.d.ts.map