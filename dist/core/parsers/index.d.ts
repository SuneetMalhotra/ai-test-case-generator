/**
 * Core Parsers
 * Base parser utilities and interfaces
 */
export interface Parser<T> {
    parse(content: string): T;
}
export declare abstract class BaseParser<T> implements Parser<T> {
    abstract parse(content: string): T;
    protected validate(content: string): void;
}
//# sourceMappingURL=index.d.ts.map