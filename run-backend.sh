#!/bin/bash

echo "🚀 Starting FlowAI Backend"
echo "=========================="

# Check if .env exists
if [ ! -f backend/.env ]; then
    echo "📝 No .env file found. Creating from template..."
    cd backend
    python setup.py
    cd ..
    echo ""
    echo "⚠️  Please edit backend/.env and add your API keys, then run this script again."
    exit 1
fi

# Activate virtual environment if it exists
if [ -d "backend/venv" ]; then
    echo "🔧 Activating virtual environment..."
    source backend/venv/bin/activate
else
    echo "⚠️  Virtual environment not found. Please run:"
    echo "   cd backend"
    echo "   python -m venv venv"
    echo "   source venv/bin/activate"
    echo "   pip install -r requirements.txt"
    exit 1
fi

# Start the backend
echo "🚀 Starting FastAPI server..."
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
