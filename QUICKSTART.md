# FlowAI - Quick Start Guide

Get your visual agentic workflow builder running in minutes!

## Prerequisites

Make sure you have the following installed:
- **Docker & Docker Compose** (for PostgreSQL and Redis)
- **Node.js 18+** and npm/yarn
- **Python 3.11+**

## Step 1: Clone and Setup

```bash
cd flowAI
```

## Step 2: Start Infrastructure

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up -d
```

Verify they're running:
```bash
docker-compose ps
```

## Step 3: Setup Backend

### Install Python dependencies:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Configure environment:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
```

### Run database migrations:

```bash
# The app will auto-create tables on startup for MVP
# In production, use: alembic upgrade head
```

### Start the backend:

```bash
uvicorn app.main:app --reload
```

Backend will be available at:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs

## Step 4: Setup Frontend

Open a new terminal:

```bash
cd frontend
npm install
```

### Configure environment:

```bash
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env
```

### Start the frontend:

```bash
npm run dev
```

Frontend will be available at: http://localhost:3000

## Step 5: Build Your First Workflow

1. **Open http://localhost:3000** in your browser

2. **Drag nodes from the left palette** onto the canvas:
   - Trigger (green) - Start point
   - LLM (blue) - AI processing
   - API (purple) - External calls
   - Conditional (yellow) - Logic branching
   - Output (red) - Final result

3. **Connect nodes** by dragging from the bottom handle of one node to the top handle of another

4. **Configure each node** by clicking on it:
   - Trigger: Set initial message
   - LLM: Choose provider (OpenAI/Anthropic/Google), model, and prompt
   - API: Set URL and HTTP method
   - Conditional: Define logic conditions
   - Output: Choose output format

5. **Save your workflow** by clicking the "Save" button in the toolbar

6. **Execute your workflow** by clicking the "Execute" button

## Example: Simple Chatbot Workflow

Here's a basic workflow to get you started:

1. **Add Trigger Node**
   - Label: "Start Chat"
   - Message: "New user message received"

2. **Add LLM Node**
   - Label: "Process with GPT-4"
   - Provider: OpenAI
   - Model: gpt-4
   - Prompt: "You are a helpful assistant. Respond to: {{user_input}}"

3. **Add Output Node**
   - Label: "Chat Response"
   - Format: JSON

4. **Connect them**: Trigger → LLM → Output

5. **Save** the workflow as "Simple Chatbot"

6. **Execute** to test!

## Example: API + LLM Workflow

Build a workflow that fetches data from an API and analyzes it:

1. **Trigger Node** → "Start Analysis"

2. **API Node**
   - URL: https://api.github.com/repos/facebook/react
   - Method: GET
   - Output Key: repo_data

3. **LLM Node**
   - Provider: OpenAI
   - Model: gpt-4
   - Prompt: "Analyze this GitHub repo data: {{repo_data}}. Provide insights about its popularity and activity."

4. **Output Node** → Format: JSON

## Troubleshooting

### Backend won't start
- Check if PostgreSQL and Redis are running: `docker-compose ps`
- Verify database connection in `.env`
- Check Python version: `python --version` (should be 3.11+)

### Frontend won't start
- Verify Node.js version: `node --version` (should be 18+)
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check if backend is running at http://localhost:8000

### Execution fails
- Verify API keys are set in backend `.env`
- Check backend logs for errors
- Verify workflow has a trigger node
- Check node configuration for missing fields

### WebSocket connection issues
- Ensure backend is running
- Check browser console for errors
- Verify firewall isn't blocking WebSocket connections

## Next Steps

- Explore the **Development Plan** (DEVELOPMENT_PLAN.md) for the full roadmap
- Add more node types (RAG, vector stores, custom tools)
- Implement authentication and multi-user support
- Deploy to production (see deployment section in README)

## API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation.

## Common Commands

### Backend
```bash
# Start backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head
```

### Frontend
```bash
# Start frontend
cd frontend
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker
```bash
# Start infrastructure
docker-compose up -d

# Stop infrastructure
docker-compose down

# View logs
docker-compose logs -f

# Reset database
docker-compose down -v
docker-compose up -d
```

## Support

For issues or questions:
- Check the README.md for detailed documentation
- Review the DEVELOPMENT_PLAN.md for architecture details
- Open an issue on GitHub (if applicable)

---

**Happy Building! 🚀**
