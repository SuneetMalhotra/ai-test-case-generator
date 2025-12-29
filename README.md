# TestCase AI - Hybrid AI Test Case Generator

AI-powered test case generation tool that transforms Product Requirement Documents (PRDs) into comprehensive test cases using **hybrid AI** (OpenAI API, Gemini API, or local Ollama).

## 🚀 Features

- **Drag & Drop Upload**: Easy file upload for PDF and Markdown documents
- **Dual Format Support**: Generate test cases in Standard Table or Gherkin (BDD) format
- **Hybrid AI**: Supports OpenAI API, Gemini API, or local Ollama (automatic fallback)
- **CSV Export**: Export test cases for Jira/Zephyr import
- **Modern UI**: Clean, responsive interface with real-time generation status
- **Vercel Ready**: Optimized for Vercel serverless deployment

## 🧠 Hybrid AI Logic

The app automatically selects the best AI provider:

1. **OpenAI API** (if `OPENAI_API_KEY` is set) → Uses `gpt-4o-mini` (cost-effective)
2. **Gemini API** (if `GEMINI_API_KEY` is set) → Uses `gemini-pro` (free tier available)
3. **Ollama** (local fallback) → Uses `llama3.1:8b` (requires Ollama running locally)

**Priority**: OpenAI > Gemini > Ollama

## 📁 Project Structure

```
ai-test-case-generator/
├── api/                    # Vercel serverless functions
│   ├── generate.ts        # Main API endpoint (hybrid AI)
│   └── health.ts          # Health check endpoint
├── frontend/              # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx        # Main application component
│   │   └── utils/         # CSV export utilities
│   └── dist/              # Built static files (for Vercel)
├── backend/               # Express server (for local dev)
│   └── src/
│       └── server.ts       # Local development server
└── vercel.json            # Vercel configuration
```

## 🛠️ Installation

### Prerequisites

- Node.js 18+
- For local Ollama: Ollama installed and running

### Setup

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Configure environment variables**:
   ```bash
   # Copy example file
   cp .env.example .env
   
   # Edit .env and add your API keys:
   # OPENAI_API_KEY=sk-... (for Vercel/production)
   # OR
   # GEMINI_API_KEY=... (alternative)
   # OR
   # Leave both empty to use Ollama locally
   ```

## 🚀 Running Locally

### Development (Both servers)

```bash
npm run dev
```

This starts:
- Backend server: http://localhost:3001 (Express)
- Frontend dev server: http://localhost:3000 (Vite)

### Using Ollama Locally

If you want to use Ollama (no API costs):

1. **Install Ollama**: https://ollama.ai
2. **Pull model**:
   ```bash
   ollama pull llama3.1:8b
   ```
3. **Start Ollama**:
   ```bash
   ollama serve
   ```
4. **Don't set** `OPENAI_API_KEY` or `GEMINI_API_KEY` in `.env`
5. The app will automatically use Ollama

## 🌐 Deploying to Vercel

### Quick Deploy

1. **Go to [vercel.com](https://vercel.com)** and sign up/login
2. **Import Git Repository**:
   - Click "Add New Project"
   - Select `SuneetMalhotra/ai-test-case-generator`
3. **Add Environment Variable**:
   - In Vercel dashboard → Settings → Environment Variables
   - Add: `OPENAI_API_KEY` = `sk-...` (your OpenAI API key)
4. **Deploy**: Click "Deploy"

Vercel will automatically:
- Build the frontend
- Deploy API routes (`/api/generate`, `/api/health`)
- Configure routing

### Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variable
vercel env add OPENAI_API_KEY
```

See [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) for detailed instructions.

## 📖 Usage

1. **Upload a PRD**: Drag & drop a PDF or Markdown file
2. **Select Format**: Choose Table or Gherkin (BDD) format
3. **Generate**: AI will analyze and generate comprehensive test cases
4. **Export**: Download as CSV for import into Jira/Zephyr

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key (for Vercel) | No* | - |
| `GEMINI_API_KEY` | Google Gemini API key | No* | - |
| `OLLAMA_HOST` | Ollama server URL (local only) | No | `http://localhost:11434` |
| `OLLAMA_MODEL` | Ollama model name | No | `llama3.1:8b` |
| `NODE_ENV` | Environment | No | `development` |
| `PORT` | Server port (local only) | No | `3001` |

*At least one AI provider key is required for Vercel deployment. For local development, Ollama can be used without API keys.

## 💰 Cost Comparison

| Provider | Model | Cost | Best For |
|----------|-------|------|----------|
| **OpenAI** | gpt-4o-mini | ~$0.01-0.05/doc | Production (Vercel) |
| **Gemini** | gemini-pro | Free tier available | Production (alternative) |
| **Ollama** | llama3.1:8b | $0 (local) | Local development |

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 📚 Documentation

- [Vercel Deployment Guide](./VERCEL_DEPLOY.md)
- [Quick Start Guide](./QUICK_START.md)
- [Architecture Overview](./ARCHITECTURE.md)

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](./LICENSE) file.

---

**Built with**: React, Vite, TypeScript, Express, OpenAI API, Gemini API, Ollama

**Deployed on**: Vercel (serverless functions)

**AI Models**: gpt-4o-mini (OpenAI), gemini-pro (Google), llama3.1:8b (Ollama)

