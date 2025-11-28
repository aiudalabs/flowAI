# 🧪 Quick Workflow Testing Guide

## ✅ Multi-Perspective Analysis Workflow Loaded!

A complex workflow with **8 nodes** and **11 edges** has been created, featuring:
- 1 Trigger node
- 5 Parallel LLM analysis nodes
- 1 Synthesis LLM node
- 1 Output node

**Workflow ID:** Check the output from the load script

---

## 🚀 Quick Test (3 Ways)

### Option 1: Test via UI (Visual & Interactive) ⭐ RECOMMENDED

1. **Open FlowAI:** http://localhost:3000

2. **Load the workflow:**
   - Click **"Load"** button in toolbar
   - Select **"Multi-Perspective AI Analysis"**
   - Wait for nodes to appear on canvas

3. **Explore the workflow:**
   - You'll see 5 LLM nodes in parallel
   - They all feed into a "Synthesis" node
   - Zoom and pan to see the structure

4. **Execute:**
   - Click **"Execute"** button
   - You'll see an **Input Form** appear
   - Enter a topic, for example:
     - "AI-powered code review tools"
     - "Remote work collaboration platforms"
     - "Quantum computing applications"
   - Click **"Execute Workflow"**

5. **Watch it run:**
   - Nodes will turn **yellow** (running)
   - Then **green** (completed)
   - See real-time logs in the **Execution Panel**

6. **View results:**
   - **Output Viewer** automatically opens when done
   - Switch between **Formatted**, **JSON**, and **Raw** views
   - Copy or download the results

---

### Option 2: Test via Script (Automated)

```bash
# Load AND execute in one command
python scripts/load_workflow.py workflows/multi_perspective_analysis.json \
  --execute \
  --topic "AI-powered code review tools" \
  --wait
```

This will:
1. Load the workflow
2. Execute it immediately
3. Wait for completion
4. Show the results in terminal

---

### Option 3: Test via API (Manual)

```bash
# 1. Load workflow (already done)
# The workflow ID is shown after loading

# 2. Execute it
curl -X POST http://localhost:8000/api/v1/executions \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "YOUR-WORKFLOW-ID",
    "input_data": {
      "topic": "AI-powered code review tools"
    }
  }'

# 3. Check status (copy execution_id from response)
curl http://localhost:8000/api/v1/executions/EXECUTION-ID

# 4. View results
# Poll the status endpoint until status is "completed"
# The output_data field will have the results
```

---

## 📊 What You'll See

### In the UI:

**Canvas:**
```
    [Trigger]
       |
   ┌───┼───┬───┬───┐
   ▼   ▼   ▼   ▼   ▼
 Tech Bus UX  Eth Comp
   └───┼───┴───┴───┘
       ▼
  [Synthesis]
       ▼
   [Output]
```

**Execution Flow:**
1. Trigger starts (yellow → green)
2. All 5 analysis nodes run (sequentially in MVP, yellow → green)
3. Synthesis node combines results (yellow → green)
4. Output node finalizes (yellow → green)

**Output Structure:**
```json
{
  "technical_analysis": "...",
  "business_analysis": "...",
  "ux_analysis": "...",
  "ethical_analysis": "...",
  "competitive_analysis": "...",
  "synthesis": "Executive Summary\n\nKey Insights:\n- ..."
}
```

---

## 🎯 Example Topics to Test

### Quick Tests (Fast Results)
- "Smart home devices"
- "Video conferencing tools"
- "Project management software"

### Interesting Topics
- "AI-powered code review tools"
- "Blockchain for healthcare"
- "Autonomous vehicle technology"
- "Virtual reality education"

### Complex Topics
- "Decentralized social media platforms"
- "Quantum computing for drug discovery"
- "Brain-computer interfaces"
- "Space tourism industry"

---

## 🔍 Debugging

### Workflow doesn't appear in "Load" list?
- Refresh the page (Cmd+Shift+R)
- Check that the script completed successfully
- Verify backend is running on port 8000

### Input form doesn't show?
- Make sure the workflow has `{{topic}}` variables
- Check browser console for errors
- The variable must be in double curly braces: `{{topic}}`

### Execution fails?
- **Check OpenAI API key:** Must be set in `backend/.env`
- **Check API quota:** You need credits on OpenAI account
- **Check backend logs:** Terminal running uvicorn shows detailed errors
- **Check browser console:** F12 to see frontend errors

### Nodes don't turn green?
- Check the Execution Panel for error logs
- Look at backend terminal for stack traces
- Verify the LLM model name is correct (gpt-4o-mini)

### Output viewer is empty?
- Wait for execution to complete (watch Execution Panel)
- Check if execution status is "completed" not "failed"
- Some outputs might be in nested fields

---

## 📈 Expected Performance

**Execution Time:**
- Current MVP: ~2-3 minutes (sequential)
- Future (parallel): ~30-45 seconds

**Token Usage:**
- Input: ~1,000 tokens
- Output: ~3,500 tokens
- Total: ~4,500 tokens

**Cost (gpt-4o-mini):**
- ~$0.001 per execution
- Very cheap for testing!

---

## 💡 Next Steps

### 1. Modify the Workflow
- Click on any node to edit its configuration
- Change prompts, models, or temperatures
- Add more nodes
- Save your changes

### 2. Create Your Own
- Drag nodes from the palette
- Connect them
- Configure each node
- Test and iterate

### 3. Export & Share
- Click "Export" to download JSON
- Share with team
- Version control in git
- Reuse across projects

### 4. Build More Complex Workflows
- Add API calls to fetch real data
- Use conditional nodes for branching logic
- Chain multiple LLM calls
- Implement feedback loops

---

## 🎓 Learning Resources

**See these files:**
- `workflows/README.md` - Detailed workflow documentation
- `NEW_FEATURES.md` - Latest features (Input Form, Output Viewer)
- `DEVELOPMENT_PLAN.md` - Full roadmap
- `DEBUGGING.md` - Troubleshooting guide

---

## 🚀 You're Ready!

Open http://localhost:3000 and start testing!

The "Multi-Perspective AI Analysis" workflow is loaded and ready to execute.

Try analyzing different topics and see how 5 AI perspectives are synthesized into actionable insights! 🎉
