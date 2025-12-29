# Push to GitHub - Quick Guide

## Step 1: Create Repository on GitHub

1. **Go to**: https://github.com/new
2. **Repository name**: `ai-test-case-generator`
3. **Description**: "AI-powered test case generation tool using LLMs"
4. **Visibility**: Choose Public or Private
5. **⚠️ IMPORTANT**: Do NOT check any boxes (no README, no .gitignore, no license - we already have these)
6. Click **"Create repository"**

## Step 2: Push Your Code

After creating the repository, GitHub will show you commands. Use these:

```bash
cd ai-test-case-generator

# Add remote (replace YOUR_USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/ai-test-case-generator.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Verify

1. Go to: `https://github.com/YOUR_USERNAME/ai-test-case-generator`
2. You should see all your files
3. Check that the README displays correctly

## Alternative: Using GitHub CLI

If you have GitHub CLI installed:

```bash
cd ai-test-case-generator
gh repo create ai-test-case-generator --public --source=. --remote=origin --push
```

## Troubleshooting

**"remote origin already exists"**
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/ai-test-case-generator.git
```

**"Authentication failed"**
- Use a Personal Access Token instead of password
- Or set up SSH keys

**"Repository not found"**
- Make sure you created the repository on GitHub first
- Check the repository name matches exactly


