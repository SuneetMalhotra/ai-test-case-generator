/**
 * Test Case Validator
 * Validates generated test cases for quality and completeness
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export declare class TestCaseValidator {
    validate(testCode: string, framework?: string): ValidationResult;
}
//# sourceMappingURL=validator.d.ts.map