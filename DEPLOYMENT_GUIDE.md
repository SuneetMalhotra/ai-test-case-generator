# Deployment Guide for AI Test Case Generator

This guide covers multiple deployment options for the full-stack application.

## ⚠️ Important: Ollama Requirement

This application requires **Ollama** to be running on the server. Ollama needs:
- At least 8GB RAM (16GB recommended)
- Docker support OR direct installation
- Persistent storage for models

## Deployment Options

### Option 1: Railway (Recommended - Easiest)

Railway supports Docker and has good Node.js support.

#### Steps:

1. **Sign up at [railway.app](https://railway.app)**

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `ai-test-case-generator` repository

3. **Configure Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3001
   OLLAMA_HOST=http://localhost:11434
   OLLAMA_MODEL=qwen2.5-coder:7b
   ```

4. **Deploy**:
   - Railway will auto-detect the Node.js app
   - It will run `npm run install:all && npm run build`
   - Then start with `cd backend && npm start`

5. **Install Ollama** (via Railway Shell):
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ollama pull qwen2.5-coder:7b
   ```

6. **Get Your URL**:
   - Railway provides a URL like: `https://ai-test-case-generator-production.up.railway.app`
   - You can add a custom domain in Railway settings

#### Pros:
- ✅ Easy setup
- ✅ Auto-deploys on git push
- ✅ Free tier available
- ✅ Good for full-stack apps

#### Cons:
- ⚠️ Need to manually install Ollama via shell
- ⚠️ Free tier has resource limits

---

### Option 2: Render

Render is similar to Railway with good Node.js support.

#### Steps:

1. **Sign up at [render.com](https://render.com)**

2. **Create New Web Service**:
   - Connect your GitHub repository
   - Select `ai-test-case-generator`

3. **Configure**:
   - **Build Command**: `npm run install:all && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Environment**: Node

4. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3001
   OLLAMA_HOST=http://localhost:11434
   OLLAMA_MODEL=qwen2.5-coder:7b
   ```

5. **Deploy**:
   - Render will build and deploy automatically
   - Install Ollama via Render Shell (similar to Railway)

6. **Custom Domain**:
   - Add custom domain in Render dashboard
   - Example: `testcase-ai.suneetmalhotra.com`

#### Pros:
- ✅ Free tier available
- ✅ Auto-deploy on push
- ✅ Custom domains supported

#### Cons:
- ⚠️ Need to manually install Ollama
- ⚠️ Free tier spins down after inactivity

---

### Option 3: Fly.io (Best for Ollama)

Fly.io has excellent Docker support and is great for apps needing system dependencies.

#### Steps:

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login**:
   ```bash
   fly auth login
   ```

3. **Create App**:
   ```bash
   cd ai-test-case-generator
   fly launch
   ```

4. **Deploy**:
   ```bash
   fly deploy
   ```

5. **Set Environment Variables**:
   ```bash
   fly secrets set OLLAMA_HOST=http://localhost:11434
   fly secrets set OLLAMA_MODEL=qwen2.5-coder:7b
   ```

6. **Get URL**:
   ```bash
   fly open
   ```

#### Pros:
- ✅ Excellent Docker support
- ✅ Can install Ollama in Dockerfile
- ✅ Global edge network
- ✅ Good performance

#### Cons:
- ⚠️ Requires Docker knowledge
- ⚠️ CLI-based workflow

---

### Option 4: VPS (DigitalOcean, Linode, etc.)

For full control, deploy on a VPS.

#### Steps:

1. **Create VPS** (Ubuntu 22.04, 16GB RAM minimum)

2. **SSH into server**:
   ```bash
   ssh root@your-server-ip
   ```

3. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install Ollama**:
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ollama pull qwen2.5-coder:7b
   ```

5. **Clone repository**:
   ```bash
   git clone https://github.com/SuneetMalhotra/ai-test-case-generator.git
   cd ai-test-case-generator
   ```

6. **Install dependencies**:
   ```bash
   npm run install:all
   ```

7. **Build**:
   ```bash
   npm run build
   ```

8. **Set up PM2** (process manager):
   ```bash
   npm install -g pm2
   cd backend
   pm2 start dist/server.js --name testcase-ai
   pm2 save
   pm2 startup
   ```

9. **Set up Nginx** (reverse proxy):
   ```bash
   sudo apt install nginx
   ```

   Create `/etc/nginx/sites-available/testcase-ai`:
   ```nginx
   server {
       listen 80;
       server_name testcase-ai.suneetmalhotra.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/testcase-ai /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

10. **Set up SSL** (Let's Encrypt):
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d testcase-ai.suneetmalhotra.com
    ```

#### Pros:
- ✅ Full control
- ✅ Can run Ollama natively
- ✅ No platform limitations
- ✅ Cost-effective for long-term

#### Cons:
- ⚠️ Requires server management
- ⚠️ Need to handle updates manually
- ⚠️ Security maintenance required

---

## Recommended: Railway (Easiest Start)

For the quickest deployment, I recommend **Railway**:

1. Sign up at railway.app
2. Connect GitHub repo
3. Add environment variables
4. Deploy
5. Install Ollama via Railway shell
6. Get your URL and update portfolio

## After Deployment

Once deployed, update your portfolio:

1. **Get your deployment URL** (e.g., `https://ai-test-case-generator-production.up.railway.app`)

2. **Update `constants.ts` in your portfolio**:
   ```typescript
   {
     id: 'ai-test-case-generator',
     // ...
     demoUrl: 'https://your-actual-url.com',
   }
   ```

3. **Commit and push**:
   ```bash
   git add constants.ts
   git commit -m "Update AI Test Case Generator demo URL"
   git push
   ```

## Testing Deployment

After deployment, test:
- ✅ Frontend loads at root URL
- ✅ Backend API responds at `/api/health`
- ✅ File upload works at `/api/generate`
- ✅ Ollama connection works

## Troubleshooting

### Ollama not found
- Install via shell: `curl -fsSL https://ollama.ai/install.sh | sh`
- Pull model: `ollama pull qwen2.5-coder:7b`
- Check: `ollama list`

### Port conflicts
- Ensure `PORT` env var is set
- Check platform's port requirements

### Build failures
- Check Node.js version (needs 18+)
- Verify all dependencies install correctly
- Check build logs in platform dashboard

