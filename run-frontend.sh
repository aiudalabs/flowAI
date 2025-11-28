#!/bin/bash

echo "🚀 Starting FlowAI Frontend"
echo "=========================="

# Check if .env exists
if [ ! -f frontend/.env ]; then
    echo "📝 No .env file found. Creating from template..."
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env"
fi

# Check if node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Start the frontend
echo "🚀 Starting Vite dev server..."
cd frontend
npm run dev
