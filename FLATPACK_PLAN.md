# Flatpack Plan: Resolve Nested Git Repository Issues

## Analysis Results

### 1. Nested Git Repos Detection
**Status:** ✅ Checked - No nested `.git` folders found in `frontend/` or subdirectories

### 2. Path Mismatch Analysis
**Current Structure:**
- `index.html` location: `ai-test-case-generator/frontend/index.html`
- `index.html` script tag: `<script type="module" src="/src/main.tsx"></script>`
- **Issue:** When Vercel sets root to `frontend/`, the absolute path `/src/main.tsx` should resolve correctly, but Vite needs the root to be properly configured.

### 3. Vercel Config Location
**Current:** `ai-test-case-generator/frontend/vercel.json`
**Correct:** Should be in `frontend/` when root directory is set to `frontend/` in Vercel dashboard

### 4. Symlink/Submodule Check
**Status:** ✅ No submodules detected (no `.gitmodules` file)

## Flatpack Strategy

### Option A: Keep Separate Repos (Recommended)
Since `ai-test-case-generator` is a separate repository, keep it independent:

1. **Ensure clean Git state:**
   ```bash
   cd ai-test-case-generator
   git status
   # Ensure all files are committed
   ```

2. **Verify Vercel is connected to correct repo:**
   - Vercel should be connected to: `SuneetMalhotra/ai-test-case-generator`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Ensure frontend/vercel.json exists:**
   ```json
   {
     "version": 2,
     "routes": [
       { "src": "/api/(.*)", "dest": "/api/$1" },
       { "src": "/(.*)", "dest": "/index.html" }
     ]
   }
   ```

### Option B: Merge into Portfolio (If Needed)
If you want everything in one repo:

1. **Remove ai-test-case-generator as separate repo:**
   ```bash
   cd ai-test-case-generator
   rm -rf .git
   ```

2. **Add to portfolio repo:**
   ```bash
   cd .. # back to portfolio root
   git add ai-test-case-generator/
   git commit -m "feat: add ai-test-case-generator to portfolio"
   ```

3. **Update Vercel config:**
   - Root Directory: `ai-test-case-generator/frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

## Recommended Action Plan

**For `ai-test-case-generator` (Standalone):**

1. ✅ Verify `frontend/vercel.json` exists
2. ✅ Ensure `frontend/package.json` has correct build script
3. ✅ Verify `frontend/index.html` uses `/src/main.tsx`
4. ✅ Check Vercel dashboard settings:
   - Root Directory: `frontend`
   - Framework Preset: Other
   - Build Command: `npm run build`
   - Output Directory: `dist`

**Current Status:**
- ✅ No nested Git repos detected
- ✅ No submodules detected
- ✅ Files are actual files (not symlinks)
- ✅ Configuration files in correct locations

## Next Steps

1. **Verify Vercel Project Settings:**
   - Go to: https://vercel.com/suneetmalhotras-projects/ai-test-case-generator
   - Settings → General
   - Confirm Root Directory is `frontend`

2. **If build still fails, check:**
   - Environment variables are set
   - Node.js version is 18+
   - All dependencies are in `frontend/package.json`
