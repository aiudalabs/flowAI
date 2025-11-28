# Quick Test - FlowAI Execution

## ✅ The Fix

I've fixed the validation error you encountered:
- **Backend:** Now handles `null` values for temperature and max_tokens
- **Frontend:** Sets default values (temperature=0.7, max_tokens=1000)

## 🧪 Test Again

### Option 1: Update Existing Workflow

If you already have a workflow with an LLM node:

1. **Click on your LLM node**
2. **Set the temperature** to `0.7` (or leave it, now has default)
3. **Set max_tokens** to `1000` (or leave it, now has default)
4. **Make sure you have an OpenAI API key** in `backend/.env`:
   ```bash
   OPENAI_API_KEY=sk-your-key-here
   ```
5. **Click "Save Changes"** on the node
6. **Click "Save"** in toolbar to save workflow
7. **Click "Execute"**

### Option 2: Create Fresh Simple Workflow

Let's test with a non-LLM workflow first to verify execution works:

1. **Clear the canvas** (refresh page)
2. **Drag a Trigger node** (green)
3. **Drag an Output node** (red)
4. **Connect them** (Trigger → Output)
5. **Configure Trigger:**
   - Click on Trigger node
   - Label: "Test Start"
   - Message: "Hello from trigger"
   - Click "Save Changes"
6. **Configure Output:**
   - Click on Output node
   - Label: "Test End"
   - Format: JSON
   - Click "Save Changes"
7. **Save workflow** - Click "Save" button
8. **Execute** - Click "Execute" button

**Expected result:**
- Alert: "Execution started!"
- Console shows logs
- Alert: "Execution completed!"
- Backend terminal shows ✅ success

### Option 3: Test with LLM (Requires API Key)

Create a simple chatbot:

1. **Trigger Node:**
   - Label: "Chat Start"
   - Message: "User asks a question"

2. **LLM Node:**
   - Provider: OpenAI
   - Model: gpt-4
   - Prompt: "Say hello and introduce yourself as FlowAI assistant in one sentence."
   - Temperature: 0.7 (auto-filled)
   - Max Tokens: 1000 (auto-filled)
   - Output Key: llm_output

3. **Output Node:**
   - Label: "Response"
   - Format: JSON

4. **Connect:** Trigger → LLM → Output

5. **Save and Execute**

**Check backend logs for:**
```
📥 Creating execution for workflow...
✅ Workflow found: ...
🚀 Starting execution...
✅ Execution completed successfully
```

## 🐛 If Still Errors

### Check API Key

If you see authentication errors:

```bash
# Edit backend/.env
nano backend/.env

# Add or update:
OPENAI_API_KEY=sk-your-actual-key-here

# Restart backend
# Press Ctrl+C in backend terminal, then:
uvicorn app.main:app --reload
```

### Check Backend Logs

The backend now shows detailed logs. Look for:
- ❌ Red X emoji = error
- ✅ Green check = success
- 📊 Chart emoji = status update

### Try Without LLM First

If LLM nodes still fail, test with just Trigger → Output to verify the execution engine works.

## 📊 What Success Looks Like

**Browser console:**
```
Starting execution...
Creating execution...
Execution created: {id: "xxx", status: "pending"}
Connecting to WebSocket: ws://localhost:8000/api/v1/executions/ws/xxx
✅ WebSocket connected
📊 Execution status: running
📝 Execution log: Workflow execution started
📝 Execution log: Executing node: trigger
📝 Execution log: Node completed: trigger
✅ Execution complete
```

**Backend terminal:**
```
📥 Creating execution for workflow: xxx
✅ Workflow found: Test Workflow
📊 Graph data: 2 nodes, 1 edges
✅ Execution created: yyy
🚀 Starting execution...
✅ Execution completed successfully
📤 Returning execution with status: completed
```

## Next Steps After Success

Once execution works:

1. **Build more complex workflows** with multiple nodes
2. **Add API nodes** to fetch external data
3. **Use conditionals** for branching logic
4. **Chain multiple LLMs** for agent-like behavior
5. **Check execution logs** in the database or via API

Let me know what you see when you test again!
