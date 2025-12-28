/**
 * AI Test Case Generator
 * Main entry point for the application
 */

import { TestCaseGenerator } from './features/generation';
import { logger } from './utils/logger';

export { TestCaseGenerator };
export * from './features/requirements';
export * from './features/gherkin';
export * from './features/validation';

async function main() {
  logger.info('AI Test Case Generator starting...');
  
  // Example usage
  const generator = new TestCaseGenerator();
  logger.info('Generator initialized', { generator: generator.constructor.name });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
