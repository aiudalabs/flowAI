# Fix Model Not Found Error

## The Problem

You're seeing: `The model 'GPT-4' does not exist or you do not have access to it.`

This happens because:
1. **Wrong model name** - "gpt-4.1-mini" doesn't exist (should be `gpt-4o-mini`)
2. **Old config cached** - Your LLM node still has old model name

## ✅ The Fix

I've updated the UI to use a **dropdown with valid model names** instead of free text input.

### Step 1: Refresh Your Browser

```bash
# Press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
# This does a hard refresh to load the new code
```

### Step 2: Fix Your LLM Node

1. **Click on your LLM node** in the canvas
2. You should now see **dropdowns instead of text inputs**
3. **Select a valid model:**
   - **Recommended:** `gpt-4o-mini` (Fast & Cheap)
   - Or: `gpt-4o` (Latest)
   - Or: `gpt-3.5-turbo` (Cheapest)
4. Make sure **Provider is "OpenAI"**
5. **Click "Save Changes"**
6. You'll see: "✅ Node configuration saved! Remember to click Save in toolbar..."

### Step 3: Save the Workflow

1. **Click "Save" button** in the top toolbar (blue button)
2. Console will show: `💾 Saving workflow with graph data:`
3. Look at the console and verify the model name is correct
4. Should see: `"model": "gpt-4o-mini"` (or whichever you chose)

### Step 4: Execute

1. **Click "Execute"** button (green button)
2. Should work now! ✅

## Valid Model Names

### OpenAI Models (Most Common)

| Model | Name in Code | Description |
|-------|-------------|-------------|
| GPT-4o Mini | `gpt-4o-mini` | **Recommended** - Fast, cheap, smart |
| GPT-4o | `gpt-4o` | Latest flagship model |
| GPT-4 Turbo | `gpt-4-turbo` | Previous generation |
| GPT-4 | `gpt-4` | Original GPT-4 (slower, expensive) |
| GPT-3.5 Turbo | `gpt-3.5-turbo` | Cheapest option |

### Anthropic Models

| Model | Name in Code |
|-------|-------------|
| Claude 3.5 Sonnet | `claude-3-5-sonnet-20241022` |
| Claude 3 Opus | `claude-3-opus-20240229` |
| Claude 3 Haiku | `claude-3-haiku-20240307` |

### Google Models

| Model | Name in Code |
|-------|-------------|
| Gemini 1.5 Flash | `gemini-1.5-flash` |
| Gemini 1.5 Pro | `gemini-1.5-pro` |
| Gemini Pro | `gemini-pro` |

## Debug: Check What's Being Sent

Open browser console (F12) and look for these logs:

**When you click "Save Changes" on node:**
```
Saving node config: {model: "gpt-4o-mini", provider: "openai", ...}
Updating node: node_1 with data: {...}
```

**When you click "Save" in toolbar:**
```
💾 Saving workflow with graph data: {...}
📊 Nodes being saved: [{id: "node_1", data: {model: "gpt-4o-mini"}}]
```

**Verify the model name is lowercase and correct!**

## If Still Not Working

### 1. Delete and Recreate the LLM Node

Sometimes the old data persists. Try:
1. Delete the LLM node
2. Drag a fresh LLM node from the palette
3. Configure it with the dropdown
4. Save and test

### 2. Check Your OpenAI API Key

Make sure it's valid:

```bash
# In backend/.env
OPENAI_API_KEY=sk-proj-...  # Should start with sk-proj- or sk-

# Test it:
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### 3. Try the Simplest Workflow First

Test without complexity:
1. **Trigger** → **Output** only (no LLM)
2. If that works, execution engine is fine
3. Then add LLM node

### 4. Check Backend Logs

Look for the model name being sent:

```
Executing node: llm
node_data: {"model": "gpt-4o-mini", ...}
```

If you see `"model": "GPT-4"` (uppercase), the old config is still cached!

## Quick Test Command

After fixing, test via API to bypass frontend:

```bash
# Get your workflow ID from the UI or logs
WORKFLOW_ID="your-workflow-id-here"

# Execute with correct model (backend will use workflow's saved config)
curl -X POST http://localhost:8000/api/v1/executions \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "'$WORKFLOW_ID'",
    "input_data": {}
  }'
```

## Summary

The key issue: **"gpt-4.1-mini" is not a real model name**

Valid options:
- ✅ `gpt-4o-mini` (what you probably wanted)
- ✅ `gpt-4o`
- ✅ `gpt-3.5-turbo`
- ❌ `gpt-4.1-mini` (doesn't exist)
- ❌ `GPT-4` (wrong capitalization, old GPT-4 is expensive)

**Now you have dropdowns, so you can't typo the model name!** 🎉
