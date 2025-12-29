/**
 * Custom error classes
 */

export class TestGenerationError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'TestGenerationError';
  }
}

export class ParserError extends Error {
  constructor(message: string, public source?: string) {
    super(message);
    this.name = 'ParserError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}


