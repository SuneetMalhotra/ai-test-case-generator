# How to Access the Frontend

## Quick Start

1. **Navigate to the project directory:**
   ```bash
   cd ai-test-case-generator
   ```

2. **Install all dependencies (first time only):**
   ```bash
   npm run install:all
   ```

3. **Start both servers:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Frontend: **http://localhost:3000**
   - Backend API: **http://localhost:3001**

## What Happens When You Run `npm run dev`

- **Backend** starts on port **3001** (handles file uploads and AI generation)
- **Frontend** starts on port **3000** (the React UI you interact with)
- Both run concurrently in the same terminal window

## Prerequisites

Before running, make sure **Ollama is running**:

```bash
# Check if Ollama is running
ollama list

# If not, start it and pull the model
ollama pull qwen2.5-coder:7b
```

## Alternative: Run Servers Separately

If you prefer to run them in separate terminals:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Then open **http://localhost:3000** in your browser.

## Troubleshooting

### Port Already in Use
- Frontend uses port **3000**
- Backend uses port **3001**
- Change ports in `frontend/vite.config.ts` or `backend/.env`

### Frontend Can't Connect to Backend
- Make sure backend is running on port 3001
- Check `frontend/vite.config.ts` proxy configuration
- Verify `backend/.env` has correct `PORT=3001`

### Ollama Connection Error
- Ensure Ollama is running: `ollama list`
- Check `backend/.env`: `OLLAMA_HOST=http://localhost:11434`
- Verify model is pulled: `ollama show qwen2.5-coder:7b`
