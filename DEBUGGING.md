# FlowAI Debugging Guide

## Testing the Execute Button

### Step 1: Check Prerequisites

1. **Backend is running** at http://localhost:8000
   - Test: Open http://localhost:8000/docs
   - Should see FastAPI Swagger docs

2. **Frontend is running** at http://localhost:3000
   - Test: Open http://localhost:3000
   - Should see the FlowAI interface

3. **Database and Redis are running**
   ```bash
   docker-compose ps
   ```
   Should show both postgres and redis as "Up"

### Step 2: Create a Simple Test Workflow

1. **Open browser console** (F12 → Console tab)

2. **Drag nodes onto canvas:**
   - Drag a **Trigger** node (green)
   - Drag an **Output** node (red)

3. **Connect them:**
   - Drag from the bottom handle of Trigger to top handle of Output

4. **Configure Trigger node:**
   - Click on the Trigger node
   - In the right panel, set Label: "Start"
   - Click "Save Changes"

5. **Configure Output node:**
   - Click on the Output node
   - Set Label: "End"
   - Click "Save Changes"

### Step 3: Save the Workflow

1. **Click "Save" button** in the toolbar
2. You should see: "Workflow saved successfully!"
3. **Check console** - should see logs about the save operation

### Step 4: Execute the Workflow

1. **Click "Execute" button**
2. **Expected behavior:**
   - Alert: "Execution started! ID: xxx"
   - Console shows: "Starting execution..."
   - Console shows: "WebSocket connected to: ws://..."
   - Console shows execution logs
   - Final alert: "Execution completed!"

3. **Check backend logs** in the terminal where you ran `uvicorn`:
   - Should see: "📥 Creating execution for workflow..."
   - Should see: "✅ Workflow found: ..."
   - Should see: "🚀 Starting execution..."
   - Should see: "✅ Execution completed successfully"

## Common Issues & Solutions

### Issue 1: Execute Button is Disabled

**Symptom:** Execute button is grayed out

**Cause:** Workflow not saved yet

**Solution:**
- Click "Save" first
- You should see "← Save first" message next to Execute button

### Issue 2: "Please save the workflow first" Alert

**Symptom:** Alert appears when clicking Execute

**Cause:** Workflow ID is not set

**Solution:**
- Save the workflow again
- Check browser console for any errors during save

### Issue 3: "Workflow is empty" Alert

**Symptom:** Alert says workflow is empty

**Cause:** No nodes on canvas

**Solution:**
- Add at least one node to the canvas
- Make sure nodes are connected

### Issue 4: No Execution Logs in Console

**Symptom:** Execution starts but no logs appear

**Causes:**
1. WebSocket connection failed
2. Backend execution error
3. API endpoint issue

**Debug Steps:**

1. **Check WebSocket connection:**
   ```
   # In browser console, look for:
   "Connecting to WebSocket: ws://localhost:8000/api/v1/executions/ws/xxx"
   "✅ WebSocket connected to: ws://..."
   ```

2. **Check backend terminal** for execution logs

3. **Check Network tab** in browser DevTools:
   - Look for failed requests
   - Check WebSocket status (should be 101 Switching Protocols)

### Issue 5: CORS Errors

**Symptom:** Console shows CORS policy errors

**Solution:**
1. Check backend `.env` file has:
   ```
   CORS_ORIGINS=http://localhost:3000,http://localhost:3001
   ```

2. Restart backend:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

### Issue 6: WebSocket Connection Failed

**Symptom:** Console shows WebSocket error

**Possible causes:**
1. Backend not running
2. Incorrect WebSocket URL
3. Firewall blocking

**Debug:**
1. Check backend is running at :8000
2. In console, check the WebSocket URL being used
3. Try accessing ws://localhost:8000/api/v1/executions/ws/test manually

### Issue 7: Database Connection Error

**Symptom:** Backend shows database errors

**Solution:**
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart if needed
docker-compose restart postgres

# Check connection
docker-compose exec postgres psql -U flowai -d flowai -c "SELECT 1;"
```

### Issue 8: "Text" field error in compiled_code

**Symptom:** Error about Text field when saving workflow

**Solution:**
This is expected - the compiled code field might be long. The system handles it automatically.

## Detailed Testing Script

Here's a complete test to verify everything works:

### 1. Test Backend Health

```bash
curl http://localhost:8000/api/v1/health
```

Expected: `{"status":"healthy","database":"connected","redis":"connected"}`

### 2. Create a Workflow via API

```bash
curl -X POST http://localhost:8000/api/v1/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Workflow",
    "description": "Testing",
    "graph_data": {
      "nodes": [
        {
          "id": "node_1",
          "type": "trigger",
          "position": {"x": 100, "y": 100},
          "data": {"label": "Start"}
        },
        {
          "id": "node_2",
          "type": "output",
          "position": {"x": 100, "y": 300},
          "data": {"label": "End"}
        }
      ],
      "edges": [
        {
          "id": "edge_1",
          "source": "node_1",
          "target": "node_2"
        }
      ]
    }
  }'
```

**Save the workflow ID from response!**

### 3. Execute via API

```bash
# Replace WORKFLOW_ID with the ID from step 2
curl -X POST http://localhost:8000/api/v1/executions \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "WORKFLOW_ID",
    "input_data": {}
  }'
```

Should return execution object with status.

### 4. Get Execution Status

```bash
# Replace EXECUTION_ID with ID from step 3
curl http://localhost:8000/api/v1/executions/EXECUTION_ID
```

Should show completed execution with logs.

## Enable More Verbose Logging

### Backend

Add to `backend/app/main.py`:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Frontend

The console already shows detailed logs. To see even more, add to browser console:

```javascript
localStorage.debug = '*'
```

## Getting Help

If you're still having issues:

1. **Check browser console** for JavaScript errors
2. **Check backend terminal** for Python errors
3. **Check docker logs**: `docker-compose logs -f`
4. **Verify environment variables** in `backend/.env`
5. **Try the API test script** above to isolate frontend vs backend issues

## Quick Reset

If everything is broken, try a full reset:

```bash
# Stop everything
docker-compose down -v
pkill -f uvicorn
pkill -f vite

# Restart infrastructure
docker-compose up -d

# Wait a moment
sleep 5

# Start backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# In new terminal, start frontend
cd frontend
npm run dev
```

Then try creating a workflow from scratch again.
