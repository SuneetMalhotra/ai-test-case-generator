/**
 * Core Parsers
 * Base parser utilities and interfaces
 */

export interface Parser<T> {
  parse(content: string): T;
}

export abstract class BaseParser<T> implements Parser<T> {
  abstract parse(content: string): T;

  protected validate(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new Error('Content cannot be empty');
    }
  }
}

