# Quick Vercel Deployment Guide

## 🚀 Step-by-Step Deployment

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "Add New Project"**
3. **Import Git Repository**:
   - Select `SuneetMalhotra/ai-test-case-generator`
   - Or paste: `https://github.com/SuneetMalhotra/ai-test-case-generator`
4. **Configure Project**:
   - **Framework Preset**: Vite (or Other)
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm run install:all`
5. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add:
     - `GEMINI_API_KEY` = `your-gemini-api-key`
     - (Optional) `OPENAI_API_KEY` = `your-openai-key` (if you want to use OpenAI instead)
6. **Click "Deploy"**
7. **Wait for build** (2-3 minutes)
8. **Your site will be live at**: `https://ai-test-case-generator-xxx.vercel.app`

### Option 2: Deploy via Vercel CLI

```bash
# Navigate to project
cd ai-test-case-generator

# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (first time - will ask questions)
vercel

# Set environment variables
vercel env add GEMINI_API_KEY
# Paste your Gemini API key when prompted

# (Optional) Add OpenAI key
vercel env add OPENAI_API_KEY
# Paste your OpenAI API key if you want to use OpenAI

# Deploy to production
vercel --prod
```

## ✅ Verify Deployment

1. **Check Health Endpoint**:
   ```
   https://your-app.vercel.app/api/health
   ```
   Should return:
   ```json
   {
     "status": "healthy",
     "aiProvider": "gemini",
     "environment": "production"
   }
   ```

2. **Test File Upload**:
   - Go to your deployed URL
   - Upload a PDF or Markdown file
   - Verify test cases are generated

## 🔧 Troubleshooting

### Build Fails

**Error**: "Cannot find module"
- **Fix**: Ensure `npm run install:all` runs before build
- Check that `vercel.json` has `installCommand: "npm run install:all"`

### API Routes Not Working

**Error**: 404 on `/api/generate`
- **Fix**: Check that `api/` folder is in the root directory
- Verify `vercel.json` routes configuration

### Environment Variables Not Working

**Error**: "API key not found"
- **Fix**: 
  1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
  2. Ensure variables are set for "Production"
  3. Redeploy after adding variables

### Frontend Not Loading

**Error**: Blank page or 404
- **Fix**: 
  1. Check `outputDirectory` in `vercel.json` is `frontend/dist`
  2. Verify `buildCommand` builds the frontend correctly
  3. Check browser console for errors

## 📝 Custom Domain (Optional)

1. **In Vercel Dashboard**:
   - Go to Project → Settings → Domains
   - Add your domain: `testcase-ai.suneetmalhotra.com`
   - Follow DNS instructions

2. **In Your DNS Provider**:
   - Add CNAME record:
     - **Name**: `testcase-ai`
     - **Target**: `cname.vercel-dns.com`

## 🎉 Success!

Once deployed, your AI Test Case Generator will be live and accessible at:
- **Vercel URL**: `https://ai-test-case-generator-xxx.vercel.app`
- **Custom Domain** (if configured): `https://testcase-ai.suneetmalhotra.com`

The app will automatically use Gemini API (since you set `GEMINI_API_KEY`).
