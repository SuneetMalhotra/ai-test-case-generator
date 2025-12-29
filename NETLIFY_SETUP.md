# Netlify Deployment Setup Guide

## Changes Made

### 1. **Removed OpenAI, Using Gemini Only**
   - Removed all OpenAI API code
   - Functions now use only Google Gemini API
   - Updated error handling for Gemini-specific errors

### 2. **Added Password Protection**
   - Password required to generate test cases
   - Set via `ACCESS_PASSWORD` environment variable in Netlify
   - Default password: `demo2024` (change in Netlify env vars)

### 3. **Added Rate Limiting**
   - 1 free generation per hour per IP address
   - Prevents abuse and controls costs
   - Rate limit resets after 1 hour

### 4. **Improved Error Handling**
   - Better JSON parsing error handling
   - Clear error messages for authentication, rate limits, and API errors
   - Frontend now handles non-JSON responses gracefully

## Environment Variables Required in Netlify

Set these in Netlify Dashboard → Site Settings → Environment Variables:

1. **GEMINI_API_KEY** (Required)
   - Your Google Gemini API key
   - Get from: https://makersuite.google.com/app/apikey

2. **ACCESS_PASSWORD** (Optional, defaults to `demo2024`)
   - Password users must enter to generate test cases
   - Change this to a secure password

## Deployment Steps

1. **Commit and push changes:**
   ```bash
   git add .
   git commit -m "feat: switch to Gemini-only, add password protection and rate limiting"
   git push origin main
   ```

2. **Deploy to Netlify:**
   ```bash
   netlify deploy --prod --build
   ```

3. **Set Environment Variables:**
   - Go to: https://app.netlify.com/projects/suneet-ai-test-gen/configuration/env
   - Add `GEMINI_API_KEY` with your API key
   - Add `ACCESS_PASSWORD` with your desired password (optional)

## Testing

### Test Health Endpoint:
```bash
curl https://testcase-ai.suneetmalhotra.com/api/health
```

### Test Generate Endpoint (with password):
```bash
curl -X POST https://testcase-ai.suneetmalhotra.com/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Feature: User Login",
    "format": "table",
    "scenarioTypes": "functional",
    "password": "YOUR_PASSWORD_HERE"
  }'
```

## Features

- ✅ Gemini-only AI generation
- ✅ Password protection
- ✅ Rate limiting (1 request/hour/IP)
- ✅ Improved error handling
- ✅ Better user feedback

## Custom Domain

Your site is configured at: https://testcase-ai.suneetmalhotra.com/
