# Vercel Deployment Guide

This project is configured for **Vercel** with hybrid AI support (OpenAI API, Gemini API, or local Ollama fallback).

## 🚀 Quick Deploy

### Option 1: Deploy via Vercel Dashboard

1. **Go to [vercel.com](https://vercel.com)** and sign up/login
2. **Import Git Repository**:
   - Click "Add New Project"
   - Select `SuneetMalhotra/ai-test-case-generator`
   - Vercel will auto-detect the configuration

3. **Configure Environment Variables**:
   In Vercel dashboard → Settings → Environment Variables, add:
   ```
   OPENAI_API_KEY=sk-... (Recommended for Vercel)
   ```
   OR
   ```
   GEMINI_API_KEY=... (Alternative)
   ```

4. **Deploy**: Click "Deploy" - Vercel will automatically:
   - Build the frontend
   - Deploy API routes
   - Configure routing

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd ai-test-case-generator
vercel

# Set environment variables
vercel env add OPENAI_API_KEY
# Paste your OpenAI API key when prompted
```

## 🔑 Environment Variables

### For Vercel (Production)

**Required (choose one):**
- `OPENAI_API_KEY` - OpenAI API key (recommended)
- `GEMINI_API_KEY` - Google Gemini API key (alternative)

**Optional:**
- `OLLAMA_HOST` - Only for local development (not used on Vercel)
- `OLLAMA_MODEL` - Only for local development

### For Local Development

If you want to use Ollama locally (no API costs):

```bash
# backend/.env
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
# Don't set OPENAI_API_KEY or GEMINI_API_KEY
```

## 🧠 Hybrid AI Logic

The app automatically selects the AI provider:

1. **If `OPENAI_API_KEY` exists** → Uses OpenAI API (gpt-4o-mini)
2. **Else if `GEMINI_API_KEY` exists** → Uses Google Gemini API
3. **Else** → Falls back to Ollama (local, requires Ollama running)

This means:
- **Vercel**: Uses OpenAI or Gemini (cloud APIs)
- **Local Dev**: Can use Ollama (free, local)

## 📁 Project Structure for Vercel

```
ai-test-case-generator/
├── api/                    # Vercel serverless functions
│   ├── generate.ts        # Main API endpoint
│   └── health.ts          # Health check
├── frontend/               # React + Vite frontend
│   └── dist/              # Built static files (served by Vercel)
└── vercel.json            # Vercel configuration
```

## 🔧 API Routes

- **`/api/generate`** - POST endpoint for generating test cases
- **`/api/health`** - GET endpoint for health checks

## ✅ Verification

After deployment:

1. **Check health**: `https://your-app.vercel.app/api/health`
2. **Test generation**: Upload a PDF via the frontend
3. **Verify AI provider**: Check response metadata for `aiProvider` field

## 💰 Cost Optimization

### Using OpenAI (Recommended)

- **Model**: `gpt-4o-mini` (cost-effective)
- **Cost**: ~$0.15 per 1M input tokens, $0.60 per 1M output tokens
- **Typical cost**: ~$0.01-0.05 per PRD document

### Using Gemini (Alternative)

- **Model**: `gemini-pro` (free tier available)
- **Cost**: Free tier: 60 requests/minute
- **Typical cost**: $0 for most use cases (within free tier)

### Using Ollama (Local Only)

- **Cost**: $0 (runs on your machine)
- **Note**: Not available on Vercel (serverless), only for local development

## 🐛 Troubleshooting

### File Upload Issues

Vercel serverless functions have a 4.5MB request limit. For larger files:
- Consider chunking the file
- Or use a file storage service (S3, Cloudinary)

### API Timeout

Vercel Pro plan allows up to 60s timeout. For longer generations:
- Upgrade to Vercel Pro
- Or optimize prompts to reduce generation time

### Environment Variables Not Working

- Ensure variables are set in Vercel dashboard
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

## 🎉 That's It!

Your app is now live on Vercel with hybrid AI support!
