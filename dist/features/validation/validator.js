/**
 * Test Case Validator
 * Validates generated test cases for quality and completeness
 */
import { logger } from '../../utils/logger';
export class TestCaseValidator {
    validate(testCode, framework = 'playwright') {
        logger.info(`Validating test code for ${framework}...`);
        const errors = [];
        const warnings = [];
        // Check for basic structure
        if (!testCode.includes('test(') && !testCode.includes('it(') && !testCode.includes('describe(')) {
            errors.push('Test code missing test structure');
        }
        // Check for assertions
        if (!testCode.includes('expect') && !testCode.includes('assert') && !testCode.includes('should')) {
            warnings.push('Test code may be missing assertions');
        }
        // Framework-specific checks
        if (framework === 'playwright') {
            if (!testCode.includes('page') && !testCode.includes('Page')) {
                warnings.push('Playwright test may be missing page object');
            }
        }
        // Check for async/await if needed
        if (testCode.includes('await') && !testCode.includes('async')) {
            errors.push('Missing async keyword for await usage');
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }
}
//# sourceMappingURL=validator.js.map