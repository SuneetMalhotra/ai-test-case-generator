# Quick Start Guide

## Prerequisites

1. **Install Ollama**: https://ollama.ai
2. **Pull the model**:
   ```bash
   ollama pull qwen2.5-coder:7b
   ```

## Installation

```bash
# Install all dependencies (root, backend, frontend)
npm run install:all
```

## Running the Application

### Development Mode (Recommended)

```bash
# Start both backend and frontend
npm run dev
```

This will:
- Start backend on http://localhost:3001
- Start frontend on http://localhost:3000
- Open browser automatically

### Production Mode

```bash
# Build both
npm run build

# Start backend (serves frontend too)
npm start
```

## First Use

1. **Ensure Ollama is running**:
   ```bash
   ollama serve
   # Or just run: ollama pull qwen2.5-coder:7b (this starts the server)
   ```

2. **Start the app**:
   ```bash
   npm run dev
   ```

3. **Upload a PRD**:
   - Drag & drop a PDF or Markdown file
   - Wait for AI to generate test cases
   - Export as CSV when done

## Troubleshooting

### "Ollama not available"
- Check Ollama is running: `ollama list`
- Verify model: `ollama show qwen2.5-coder:7b`
- Check backend .env: `OLLAMA_HOST=http://localhost:11434`

### "Port already in use"
- Backend uses port 3001
- Frontend uses port 3000
- Change in `backend/.env` or `frontend/vite.config.ts`

### "File upload fails"
- Check file size (max 10MB)
- Verify file type (PDF, Markdown, or Text)
- Check backend logs for errors

