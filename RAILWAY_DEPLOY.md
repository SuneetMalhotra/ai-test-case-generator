# Railway Deployment Guide (Cursor-Automated)

This guide uses Cursor to automate Railway deployment setup.

## ✅ What's Already Configured

1. **`railway.json`** - Automated build configuration
2. **`scripts/setup-ollama.sh`** - Auto-installs Ollama and pulls model on startup
3. **Health check endpoint** - `/api/health` for Railway monitoring
4. **PORT environment variable** - Uses Railway's provided PORT
5. **Production model** - Defaults to `llama3.1:8b` (smaller, cheaper than 20b)

## 🚀 Quick Deploy via Railway CLI (In Cursor Terminal)

### Step 1: Install Railway CLI

Open Cursor Terminal (`Ctrl + ~` or `Cmd + ~`) and run:

```bash
npm i -g @railway/cli
```

### Step 2: Login to Railway

```bash
railway login
```

This will open a browser tab for authentication.

### Step 3: Link Your Project

```bash
cd ai-test-case-generator
railway link
```

Select your repository when prompted.

### Step 4: Set Environment Variables

```bash
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set OLLAMA_HOST=http://127.0.0.1:11434
railway variables set OLLAMA_MODEL=llama3.1:8b
```

### Step 5: Deploy

```bash
railway up
```

This will:
- Build the app using `railway.json` configuration
- Run `npm run install:all && npm run build`
- Start with `npm run start:production` (which auto-installs Ollama)
- Pull the `llama3.1:8b` model automatically

### Step 6: Get Your URL

After deployment, Railway will provide a URL like:
```
https://ai-test-case-generator-production.up.railway.app
```

View it with:
```bash
railway domain
```

## 🌐 Setting Up Custom Domain

### In Railway Dashboard:

1. Go to your project → Settings → Domains
2. Click "Add Domain"
3. Enter: `testcase-ai.suneetmalhotra.com`
4. Railway will provide DNS instructions

### In Your DNS Provider:

Add a **CNAME** record:
- **Name/Host:** `testcase-ai`
- **Target/Value:** (Railway's provided domain, e.g., `ai-test-case-generator-production.up.railway.app`)

### Update Portfolio

Once DNS propagates (5-30 minutes), update `constants.ts`:

```typescript
{
  id: 'ai-test-case-generator',
  // ...
  demoUrl: 'https://testcase-ai.suneetmalhotra.com',
}
```

## 📊 Monitoring

Check deployment status:
```bash
railway logs
```

Check health:
```bash
curl https://your-railway-url.up.railway.app/api/health
```

## 💰 Cost Optimization

The app is configured to use **`llama3.1:8b`** instead of `gpt-oss:20b` for production because:
- **8B model** requires ~8GB RAM (fits Railway's free tier better)
- **20B model** requires ~16-24GB RAM (expensive on Railway)
- **8B is faster** and still produces high-quality test cases

To use a different model, update the environment variable:
```bash
railway variables set OLLAMA_MODEL=your-model-name
```

## 🔧 Troubleshooting

### Ollama Not Starting

Check logs:
```bash
railway logs
```

The `setup-ollama.sh` script should auto-install, but if it fails:
1. Go to Railway dashboard → Your service → Shell
2. Run manually:
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ollama pull llama3.1:8b
   ```

### Port Issues

Railway automatically sets `PORT`. The app uses `process.env.PORT || 3001`.

### Build Failures

Check build logs in Railway dashboard. Common issues:
- Node version mismatch (needs 18+)
- Missing dependencies
- TypeScript compilation errors

## ✅ Verification Checklist

After deployment, verify:
- [ ] Frontend loads at root URL
- [ ] `/api/health` returns `{"status":"healthy"}`
- [ ] Ollama model is available (check health endpoint)
- [ ] File upload works at `/api/generate`
- [ ] Test case generation completes successfully

## 🎉 That's It!

Your app is now live! The "Live Demo" button on your portfolio will work once DNS is configured.
