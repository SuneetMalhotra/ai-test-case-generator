# AI Test Case Generator

AI-powered test case generation tool that transforms requirements, PRDs, and Gherkin specs into executable test scripts using LLMs.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)

## 🚀 Features

- **Requirement Analysis**: Parse PRDs and product requirements
- **Gherkin Support**: Convert Gherkin specs to test cases
- **Multi-Format Output**: Generate tests in multiple frameworks (Playwright, Jest, Cypress)
- **Smart Test Generation**: AI-powered test scenario creation
- **Validation**: Built-in test case validation and quality checks

## 📁 Project Structure

```
ai-test-case-generator/
├── src/
│   ├── features/                    # Feature modules (business logic)
│   │   ├── requirements/            # PRD and requirement parsing
│   │   │   ├── parser.ts            # Requirement parser implementation
│   │   │   └── index.ts             # Public exports
│   │   ├── gherkin/                 # Gherkin spec processing
│   │   │   ├── parser.ts            # Gherkin parser implementation
│   │   │   └── index.ts             # Public exports
│   │   ├── generation/              # Test case generation
│   │   │   └── index.ts             # Main generator orchestrator
│   │   └── validation/              # Test validation
│   │       ├── validator.ts         # Test case validator
│   │       └── index.ts              # Public exports
│   ├── core/                        # Core abstractions
│   │   ├── llm/                     # LLM client abstraction
│   │   │   └── client.ts            # OpenAI/Ollama client
│   │   ├── parsers/                 # Base parser interfaces
│   │   │   └── index.ts             # Parser base classes
│   │   └── generators/             # Base generator interfaces
│   │       └── base.ts               # Generator base class
│   ├── utils/                       # Shared utilities
│   │   ├── logger.ts                # Logging utility
│   │   └── errors.ts                # Custom error classes
│   └── index.ts                     # Main entry point
├── tests/
│   └── features/                    # Feature tests
│       └── generation.test.ts      # Generator tests
├── .env.example                     # Environment variables template
├── .eslintrc.json                   # ESLint configuration
├── .prettierrc                      # Prettier configuration
├── .gitignore                       # Git ignore rules
├── ARCHITECTURE.md                  # Architecture documentation
├── LICENSE                          # MIT License
├── package.json                     # Dependencies and scripts
├── README.md                        # This file
├── tsconfig.json                    # TypeScript configuration
└── vitest.config.ts                 # Vitest test configuration
```

## 🛠️ Installation

```bash
npm install
```

## ⚙️ Configuration

Copy `.env.example` to `.env` and configure:

```bash
OPENAI_API_KEY=your-api-key-here
# Or for Ollama:
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1
```

## 📖 Usage

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Testing
npm test
```

## 🧪 Example

```typescript
import { TestCaseGenerator } from './features/generation';

const generator = new TestCaseGenerator();
const testCases = await generator.generateFromPRD(prdContent);
```

## 📝 License

MIT
