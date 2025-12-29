#!/bin/bash
# Setup script to ensure Ollama is installed and model is available

set -e

OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}"
OLLAMA_MODEL="${OLLAMA_MODEL:-llama3.1:8b}"

echo "🔧 Setting up Ollama..."

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
  echo "📦 Installing Ollama..."
  curl -fsSL https://ollama.ai/install.sh | sh
else
  echo "✅ Ollama is already installed"
fi

# Start Ollama in background if not running
if ! curl -s "${OLLAMA_HOST}/api/tags" &> /dev/null; then
  echo "🚀 Starting Ollama server..."
  ollama serve &
  sleep 5
fi

# Check if model is available
echo "🔍 Checking for model: ${OLLAMA_MODEL}..."
MODEL_EXISTS=$(curl -s "${OLLAMA_HOST}/api/tags" | grep -o "\"name\":\"${OLLAMA_MODEL}\"" || echo "")

if [ -z "$MODEL_EXISTS" ]; then
  echo "📥 Pulling model: ${OLLAMA_MODEL}..."
  ollama pull "${OLLAMA_MODEL}"
else
  echo "✅ Model ${OLLAMA_MODEL} is already available"
fi

echo "✅ Ollama setup complete!"
