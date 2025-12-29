/**
 * Test Case Generator Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { TestCaseGenerator } from '../../src/features/generation';

describe('TestCaseGenerator', () => {
  it('should initialize with default config', () => {
    const generator = new TestCaseGenerator();
    expect(generator).toBeDefined();
  });

  it('should accept custom config', () => {
    const generator = new TestCaseGenerator({
      provider: 'ollama',
      model: 'llama3.1',
    });
    expect(generator).toBeDefined();
  });
});

