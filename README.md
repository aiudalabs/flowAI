# FlowAI - Visual Agentic Workflow Builder

Build, execute, and deploy LangGraph agentic workflows through a visual drag-and-drop interface.

## Features

- 🎨 **Visual Workflow Builder** - Drag-and-drop interface powered by ReactFlow
- 🤖 **Multi-LLM Support** - OpenAI, Anthropic, Google Gemini
- 🔧 **Extensible Nodes** - LLMs, Tools, APIs, MCPs, Control Flow
- ⚡ **Real-time Execution** - Watch your workflows run with live visualization
- 🚀 **Deploy Anywhere** - Export to Docker, Cloud Run, Lambda
- 💾 **State Management** - Built on LangGraph with checkpointing and memory

## Visual Overview

![FlowAI Architecture](./imgs/ui.png)

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.11+
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+

### Development Setup

1. **Set up environment variables:**

```bash
# Backend (.env in backend/ directory)
cp backend/.env.example backend/.env
# Edit backend/.env and add your API keys:
# OPENAI_API_KEY=your-key-here
# DATABASE_URL=postgresql://flowai:flowai@localhost:5432/flowai
# REDIS_URL=redis://localhost:6379/0
```

2. **Clone and install dependencies:**

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Start infrastructure (PostgreSQL + Redis):**

```bash
docker-compose up -d
```

3. **Run database migrations:**

```bash
cd backend
alembic upgrade head
```

4. **Start development servers:**

```bash
# Terminal 1 - Frontend
cd frontend
npm run dev

# Terminal 2 - Backend
cd backend
uvicorn app.main:app --reload
```

5. **Open your browser:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Project Structure

```
flowAI/
├── frontend/              # React + TypeScript + ReactFlow
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── features/     # Feature modules (workflow, nodes, execution)
│   │   ├── lib/          # Utilities and configurations
│   │   ├── hooks/        # Custom React hooks
│   │   ├── types/        # TypeScript type definitions
│   │   └── App.tsx       # Main app component
│   └── package.json
│
├── backend/              # FastAPI + LangGraph
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Core configuration
│   │   ├── models/       # Database models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   │   ├── compiler/ # ReactFlow → LangGraph compiler
│   │   │   ├── executor/ # Workflow execution engine
│   │   │   └── nodes/    # Node type implementations
│   │   └── main.py       # FastAPI app
│   └── requirements.txt
│
├── docker-compose.yml    # Local development infrastructure
└── DEVELOPMENT_PLAN.md   # Detailed development roadmap
```

## MVP Scope

The initial MVP includes:

- ✅ ReactFlow canvas with zoom/pan controls
- ✅ 5 essential node types:
  - Manual Trigger
  - OpenAI LLM
  - HTTP API Call
  - Conditional (if/else)
  - Output
- ✅ Node configuration panel
- ✅ Workflow save/load
- ✅ LangGraph compilation
- ✅ Real-time execution visualization
- ✅ Execution history
- ✅ **Dynamic Input Forms** - Auto-detect variables (`{{var}}`) and show input forms
- ✅ **Beautiful Output Viewer** - Formatted, JSON, and Raw views with Markdown support
- ✅ **WebSocket Live Updates** - Real-time execution logs and node status updates

## Tech Stack

- **Frontend:** React 18, TypeScript, ReactFlow, Tailwind CSS, shadcn/ui
- **Backend:** FastAPI, LangGraph, LangChain, SQLAlchemy
- **Database:** PostgreSQL, Redis
- **Deployment:** Docker, Kubernetes

## Contributing

See [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for the detailed roadmap and architecture.

## License

MIT
