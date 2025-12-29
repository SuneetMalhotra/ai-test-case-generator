# TestCase AI - Local AI Test Case Generator

AI-powered test case generation tool that transforms Product Requirement Documents (PRDs) into comprehensive test cases using local Ollama AI.

## 🚀 Features

- **Drag & Drop Upload**: Easy file upload for PDF and Markdown documents
- **Dual Format Support**: Generate test cases in Standard Table or Gherkin (BDD) format
- **Local AI**: Powered by Ollama (qwen2.5-coder:7b) - no API costs, complete privacy
- **CSV Export**: Export test cases for Jira/Zephyr import
- **Modern UI**: Clean, responsive interface with real-time generation status

## 📁 Project Structure

```
ai-test-case-generator/
├── backend/              # Node.js + Express server
│   ├── src/
│   │   └── server.ts     # API endpoints and Ollama integration
│   ├── package.json
│   └── tsconfig.json
├── frontend/             # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx      # Main application component
│   │   ├── components/  # React components
│   │   └── utils/       # CSV export utilities
│   ├── package.json
│   └── vite.config.ts
└── package.json          # Root package.json with unified scripts
```

## 🛠️ Installation

### Prerequisites

- Node.js 18+
- Ollama installed and running
- qwen2.5-coder:7b model pulled

### Setup

1. **Install Ollama and pull model**:
   ```bash
   # Install Ollama from https://ollama.ai
   ollama pull qwen2.5-coder:7b
   ```

2. **Install dependencies**:
   ```bash
   npm run install:all
   ```

3. **Configure backend**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env if needed (defaults work for local Ollama)
   ```

## 🚀 Running the Application

### Development (Both servers)

```bash
npm run dev
```

This starts:
- Backend server: http://localhost:3001
- Frontend dev server: http://localhost:3000

### Production

```bash
# Build both
npm run build

# Start backend
npm start
```

## 📖 Usage

1. **Start Ollama** (if not running):
   ```bash
   ollama serve
   ```

2. **Launch the app**:
   ```bash
   npm run dev
   ```

3. **Upload a PRD**:
   - Drag & drop a PDF or Markdown file
   - Or click to browse and select

4. **Choose format**:
   - Standard Table: Structured table with ID, Title, Steps, Expected Result, Priority
   - Gherkin (BDD): Given-When-Then syntax

5. **Export results**:
   - Click "Export CSV" to download for Jira/Zephyr import

## 🎨 UI Features

- **Drag & Drop Zone**: Modern file upload interface
- **Settings Sidebar**: Toggle between output formats
- **Loading States**: "Thinking..." indicator during AI processing
- **Results Display**: Formatted test cases with export options
- **Stats Dashboard**: Track documents and test cases

## 🔧 Configuration

### Backend (.env)

```bash
PORT=3001
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b
```

### Supported File Types

- PDF (.pdf)
- Markdown (.md)
- Text (.txt)

### File Size Limit

- Maximum: 10MB per file

## 📊 Test Case Structure

### Standard Table Format

| ID | Title | Steps | Expected Result | Priority |
|----|-------|-------|-----------------|----------|
| TC-1 | Test case title | Step 1, Step 2... | Expected outcome | High/Medium/Low |

### Gherkin Format

```gherkin
Feature: Feature Name
  Scenario: Test scenario
    Given precondition
    When action
    Then expected result
```

## 🔌 API Endpoints

### POST /api/generate

Upload a PRD file and generate test cases.

**Request**:
- `file`: PDF or Markdown file (multipart/form-data)
- `format`: `table` or `gherkin`

**Response**:
```json
{
  "success": true,
  "testCases": "Generated test cases...",
  "format": "table",
  "metadata": {
    "fileName": "prd.pdf",
    "fileSize": 12345,
    "extractedLength": 5000
  }
}
```

### GET /api/health

Check Ollama connection and model availability.

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch
```

## 📝 License

MIT

## 🙏 Acknowledgments

Inspired by BrowserStack's Testing Toolkit, built with local AI for privacy and cost-effectiveness.

