# Example Workflows

This directory contains pre-built workflow examples that you can load and test.

## 🎯 Multi-Perspective AI Analysis

**File:** `multi_perspective_analysis.json`

A complex workflow that analyzes any topic from 5 different perspectives using parallel LLM calls:

1. **Technical Analysis** - Implementation details, technologies, feasibility
2. **Business Analysis** - Market opportunities, revenue potential, viability
3. **User Experience Analysis** - Usability, accessibility, user satisfaction
4. **Ethical Analysis** - Privacy, fairness, societal impact, risks
5. **Competitive Analysis** - Existing solutions, market leaders, advantages

All analyses are then synthesized into a comprehensive report with recommendations.

### Architecture

```
        Trigger
           │
    ┌──────┼──────┬──────┬──────┐
    │      │      │      │      │
Technical Business UX Ethical Competitive
    │      │      │      │      │
    └──────┼──────┴──────┴──────┘
           │
      Synthesizer
           │
        Output
```

### Features

- ✅ **5 Parallel LLM Calls** - All perspectives analyzed simultaneously
- ✅ **Variable Input** - Uses `{{topic}}` variable for dynamic topics
- ✅ **Synthesis** - Combines all perspectives into actionable insights
- ✅ **Comprehensive Output** - Executive summary, insights, recommendations, risks

### Quick Start

#### Option 1: Load via Script (Easiest)

```bash
# 1. Make sure backend is running
cd backend
uvicorn app.main:app --reload

# 2. In another terminal, load the workflow
cd /path/to/flowAI
python scripts/load_workflow.py workflows/multi_perspective_analysis.json

# 3. Optional: Load AND execute immediately
python scripts/load_workflow.py workflows/multi_perspective_analysis.json \
  --execute \
  --topic "AI-powered code review tools" \
  --wait
```

#### Option 2: Load via UI

1. **Start the servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   uvicorn app.main:app --reload

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Open browser:** http://localhost:3000

3. **Import via JSON:**
   - Copy the contents of `multi_perspective_analysis.json`
   - In FlowAI, create nodes manually OR
   - Use the Load script first, then load from saved workflows

4. **Load from saved:**
   - Run the load script first
   - Click "Load" in the UI
   - Select "Multi-Perspective AI Analysis"

5. **Execute:**
   - Click "Execute"
   - Enter a topic (e.g., "Autonomous vehicles", "Quantum computing", "Remote work tools")
   - Watch real-time execution
   - View beautiful results in Output Viewer

#### Option 3: Load via API

```bash
# Load the workflow
curl -X POST http://localhost:8000/api/v1/workflows \
  -H "Content-Type: application/json" \
  -d @workflows/multi_perspective_analysis.json

# This will return a workflow_id, use it to execute:
curl -X POST http://localhost:8000/api/v1/executions \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "YOUR-WORKFLOW-ID-HERE",
    "input_data": {
      "topic": "AI-powered code review tools"
    }
  }'
```

### Example Topics to Try

**Technology:**
- "AI-powered code review tools"
- "Quantum computing applications"
- "Edge computing for IoT"
- "Blockchain for supply chain"

**Products:**
- "Smart home automation systems"
- "Virtual reality fitness platforms"
- "AI-powered personal assistants"
- "Autonomous delivery robots"

**Trends:**
- "Remote work and hybrid teams"
- "Sustainable technology practices"
- "Web3 and decentralized apps"
- "Personalized medicine with AI"

**Business:**
- "Subscription-based business models"
- "Creator economy platforms"
- "B2B SaaS marketplace"
- "Direct-to-consumer brands"

### Expected Output

The workflow will generate:

1. **5 Detailed Analyses** (500 tokens each)
   - Technical perspective
   - Business perspective
   - UX perspective
   - Ethical perspective
   - Competitive perspective

2. **Synthesis Report** (1000 tokens)
   - Executive Summary (2 paragraphs)
   - Key Insights (5-7 bullet points)
   - Recommendations (3-5 prioritized actions)
   - Risks & Mitigation (3-4 key risks)

### Execution Time

- **Parallel Execution:** ~30-45 seconds
  - 5 LLM calls run simultaneously
  - 1 synthesis LLM call after
- **Sequential (if parallel fails):** ~2-3 minutes

### Cost Estimate

Using `gpt-4o-mini`:
- Input: ~1,000 tokens total
- Output: ~3,500 tokens total
- Cost: ~$0.001 per execution

### Customization Ideas

1. **Add More Perspectives:**
   - Legal analysis
   - Financial analysis
   - Environmental impact
   - Cultural considerations

2. **Different LLM Models:**
   - Change to `gpt-4o` for better quality
   - Mix models (e.g., GPT-4 for synthesis, GPT-3.5 for initial analyses)

3. **Add Conditional Logic:**
   - Only run ethical analysis if topic involves user data
   - Skip competitive analysis for internal projects

4. **Chain Multiple Workflows:**
   - Use output to generate action plans
   - Feed insights into a presentation generator
   - Create follow-up research workflows

### Troubleshooting

**Workflow won't load:**
- Make sure backend is running on port 8000
- Check that `OPENAI_API_KEY` is set in backend/.env

**Execution fails:**
- Verify OpenAI API key is valid
- Check API quota/rate limits
- Look at backend logs for detailed errors

**Parallel execution doesn't work:**
- Current MVP executes sequentially
- Parallel execution coming in Phase 2 of development plan

**Variables not detected:**
- Make sure you use `{{variable}}` syntax (double curly braces)
- Variables are case-sensitive

---

## Creating Your Own Workflows

### Step 1: Design the Workflow

1. Identify the goal
2. Break down into steps
3. Determine which steps can run in parallel
4. Plan the data flow

### Step 2: Create the JSON

```json
{
  "name": "Your Workflow Name",
  "description": "What it does",
  "graph_data": {
    "nodes": [
      {
        "id": "unique-id",
        "type": "trigger|llm|api|conditional|output",
        "position": { "x": 100, "y": 100 },
        "data": { /* node-specific config */ }
      }
    ],
    "edges": [
      {
        "id": "edge-id",
        "source": "source-node-id",
        "target": "target-node-id"
      }
    ]
  }
}
```

### Step 3: Load and Test

```bash
python scripts/load_workflow.py your_workflow.json --execute --wait
```

---

## Next: Build in UI, Export JSON

You can also:
1. Build workflows in the UI
2. Export them (using the Export button)
3. Share the JSON with your team
4. Version control your workflows!

This way you can design visually and reuse programmatically. 🚀
