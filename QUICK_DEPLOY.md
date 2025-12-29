# Quick Deploy to Railway (5 Minutes)

## Step-by-Step Guide

### 1. Sign Up & Connect GitHub
- Go to [railway.app](https://railway.app)
- Sign up with GitHub
- Click "New Project" → "Deploy from GitHub repo"
- Select `SuneetMalhotra/ai-test-case-generator`

### 2. Configure Build Settings
Railway will auto-detect, but verify:
- **Root Directory**: `/` (root)
- **Build Command**: `npm run install:all && npm run build`
- **Start Command**: `cd backend && npm start`

### 3. Add Environment Variables
In Railway dashboard → Variables tab, add:
```
NODE_ENV=production
PORT=3001
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b
```

### 4. Deploy
- Railway will automatically build and deploy
- Wait for "Deploy Successful" message

### 5. Install Ollama (After First Deploy)
1. Go to Railway dashboard → Your service
2. Click "Shell" tab
3. Run:
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ollama pull qwen2.5-coder:7b
   ```

### 6. Get Your URL
- Railway provides: `https://your-app-name.up.railway.app`
- Copy this URL

### 7. Add Custom Domain (Optional)
- In Railway → Settings → Domains
- Add: `testcase-ai.suneetmalhotra.com`
- Update DNS: Add CNAME record pointing to Railway's domain

### 8. Update Portfolio
Edit `jqz/constants.ts`:
```typescript
{
  id: 'ai-test-case-generator',
  // ...
  demoUrl: 'https://your-railway-url.up.railway.app', // or your custom domain
}
```

### 9. Test
Visit your URL and test:
- ✅ Frontend loads
- ✅ Upload a test PDF
- ✅ Generate test cases

## That's It! 🎉

Your app is now live and the "Live Demo" button on your portfolio will work!
