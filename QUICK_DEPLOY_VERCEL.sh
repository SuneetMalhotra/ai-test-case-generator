#!/bin/bash
# Quick Vercel Deployment Script

echo "🚀 Deploying AI Test Case Generator to Vercel..."
echo ""

# Check if logged in
if ! vercel whoami &> /dev/null; then
  echo "📝 Please login to Vercel first..."
  vercel login
fi

echo ""
echo "📦 Deploying to Vercel..."
echo ""

# Deploy (will ask questions on first run)
vercel --yes

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📝 Next steps:"
echo "1. If this is your first deployment, Vercel will ask you to:"
echo "   - Link to existing project or create new"
echo "   - Set up project settings"
echo ""
echo "2. Add environment variables in Vercel Dashboard:"
echo "   - Go to: https://vercel.com/dashboard"
echo "   - Select your project"
echo "   - Go to Settings → Environment Variables"
echo "   - Add: GEMINI_API_KEY = your-key"
echo ""
echo "3. After adding variables, redeploy:"
echo "   vercel --prod"
echo ""
