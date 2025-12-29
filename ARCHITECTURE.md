# Architecture

## Project Structure

This project follows a **feature-based architecture** with clear separation of concerns.

```
ai-test-case-generator/
├── src/
│   ├── features/           # Feature modules (business logic)
│   │   ├── requirements/   # PRD and requirement parsing
│   │   ├── gherkin/        # Gherkin spec processing
│   │   ├── generation/     # Test case generation orchestration
│   │   └── validation/     # Test validation and quality checks
│   ├── core/               # Core abstractions
│   │   ├── llm/            # LLM client (OpenAI/Ollama)
│   │   ├── parsers/        # Base parser interfaces
│   │   └── generators/     # Base generator interfaces
│   ├── utils/              # Shared utilities
│   │   ├── logger.ts       # Logging utility
│   │   └── errors.ts       # Custom error classes
│   └── index.ts            # Main entry point
├── tests/                  # Test files
└── config files            # TypeScript, ESLint, Prettier, etc.
```

## Design Principles

### 1. Feature-Based Organization
Each feature is self-contained with its own:
- Parser/processor
- Business logic
- Exports (index.ts)

### 2. Core Abstractions
- **LLM Client**: Abstracted to support multiple providers
- **Parsers**: Base interfaces for extensibility
- **Generators**: Framework-agnostic generation logic

### 3. Dependency Injection
- LLM client injected into generators
- Easy to mock for testing
- Flexible configuration

## Data Flow

```
Input (PRD/Gherkin)
    ↓
Parser (requirements/gherkin)
    ↓
Generator (orchestrates LLM)
    ↓
LLM Client (OpenAI/Ollama)
    ↓
Generated Test Code
    ↓
Validator (quality checks)
    ↓
Output (validated test code)
```

## Extensibility

### Adding a New Parser
1. Create parser in `src/core/parsers/`
2. Implement `Parser<T>` interface
3. Export from feature module

### Adding a New Generator
1. Extend `BaseGenerator` in `src/core/generators/`
2. Implement framework-specific logic
3. Register in generation feature

### Adding a New LLM Provider
1. Extend `LLMClient` in `src/core/llm/`
2. Implement provider-specific API calls
3. Update client factory

## Testing Strategy

- **Unit Tests**: Each feature module
- **Integration Tests**: End-to-end generation flow
- **Mock LLM**: Use test fixtures for consistent results

