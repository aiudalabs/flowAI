#!/bin/bash

echo "🌊 FlowAI - Visual Agentic Workflow Builder"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start infrastructure
echo "🐘 Starting PostgreSQL and Redis..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if services are running
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ Failed to start infrastructure. Check docker-compose logs."
    exit 1
fi

echo "✅ Infrastructure is ready!"
echo ""

# Setup backend if needed
if [ ! -f backend/.env ]; then
    echo "📝 Setting up backend..."
    cd backend
    python setup.py
    cd ..
    echo ""
fi

# Setup frontend if needed
if [ ! -f frontend/.env ]; then
    echo "📝 Setting up frontend..."
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env"
    echo ""
fi

echo "================================================"
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and add your API keys"
echo "2. Run the backend:"
echo "   chmod +x run-backend.sh"
echo "   ./run-backend.sh"
echo ""
echo "3. In a new terminal, run the frontend:"
echo "   chmod +x run-frontend.sh"
echo "   ./run-frontend.sh"
echo ""
echo "4. Open http://localhost:3000 in your browser"
echo "================================================"
