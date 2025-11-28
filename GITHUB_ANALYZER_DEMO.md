# 🚀 GitHub Analyzer Demo - Step by Step

## What You're Building

A workflow that:
1. Fetches real data from GitHub API (React repository)
2. Analyzes it with AI (GPT-4o-mini)
3. Shows beautiful visual execution feedback
4. Displays results in a log panel

## 🎬 Setup Steps

### 1. Refresh Your Browser

Hard refresh to get the new code:
- **Mac:** `Cmd + Shift + R`
- **Windows:** `Ctrl + Shift + R`

### 2. Build the Workflow

#### Node 1: Trigger
1. Drag **Trigger** (green) to canvas
2. Click on it
3. Configure:
   - **Label:** `Start Analysis`
   - **Message:** `Analyzing GitHub repository`
4. Click **"Save Changes"**

#### Node 2: API Call
1. Drag **API** (purple) to canvas
2. Click on it
3. Configure:
   - **Label:** `Fetch GitHub Data`
   - **URL:** `https://api.github.com/repos/facebook/react`
   - **Method:** `GET`
   - **Output Key:** `repo_data`
4. Click **"Save Changes"**

#### Node 3: AI Analysis
1. Drag **LLM** (blue) to canvas
2. Click on it
3. Configure:
   - **Label:** `Analyze Data`
   - **Provider:** `OpenAI`
   - **Model:** `gpt-4o-mini`
   - **Prompt:**
     ```
     Analyze this GitHub repository data and provide a detailed summary:

     {{repo_data}}

     Please provide:
     1. Repository popularity (stars, forks, watchers)
     2. Recent activity and commit frequency
     3. Main programming language and tech stack
     4. Community engagement (issues, pull requests)
     5. Overall project health assessment

     Format your response in clear sections.
     ```
   - **Temperature:** `0.7` (should be pre-filled)
   - **Max Tokens:** `1000` (should be pre-filled)
   - **Output Key:** `analysis`
4. Click **"Save Changes"**

#### Node 4: Output
1. Drag **Output** (red) to canvas
2. Click on it
3. Configure:
   - **Label:** `Final Result`
   - **Format:** `JSON`
4. Click **"Save Changes"**

### 3. Connect the Nodes

Draw connections:
1. **Trigger** (bottom handle) → **API** (top handle)
2. **API** (bottom handle) → **LLM** (top handle)
3. **LLM** (bottom handle) → **Output** (top handle)

Should look like:
```
[Trigger]
    ↓
  [API]
    ↓
  [LLM]
    ↓
[Output]
```

### 4. Save the Workflow

1. Click **"Save"** button (blue, top toolbar)
2. Name it: `GitHub Analyzer`
3. You should see: "Workflow saved successfully!"

### 5. Execute!

1. Click **"Execute"** button (green, top toolbar)
2. **Watch the magic happen!** ✨

## 🎨 What You'll See

### Visual Feedback on Nodes

- **Yellow pulsing ring + spinner** = Node is running
- **Green ring + checkmark** = Node completed successfully
- **Red ring + X** = Node failed

### Execution Log Panel (Bottom Right)

A floating panel will appear showing:
- Real-time logs from each node
- Timestamps
- Node IDs
- Data payloads (click "View data" to expand)

### Console Output

Check browser console (F12) for:
- Full GitHub API response
- AI analysis text
- Final workflow output

## 📊 Expected Results

### Trigger Node
- Status: ✅ Completed
- Log: "Executing node: trigger"

### API Node
- Status: ✅ Completed
- Log: "Executing node: api"
- Data: Full GitHub repo JSON (stars, forks, language, etc.)

### LLM Node
- Status: ✅ Completed (takes 2-5 seconds)
- Log: "Executing node: llm"
- Data: AI analysis summary

### Output Node
- Status: ✅ Completed
- Log: "Node completed: output"

### Final Alert
```
✅ Execution completed!

Status: completed

Check console for full output.
```

## 🎯 Success Indicators

1. **All nodes turn green** with checkmarks
2. **Execution panel shows logs** from all 4 nodes
3. **Console shows the AI analysis** - readable summary of React repo
4. **No red X icons** on nodes

## 🐛 Troubleshooting

### API Node Fails (Red)
- GitHub API might be rate-limited
- Try a different repo URL: `https://api.github.com/repos/microsoft/vscode`

### LLM Node Fails (Red)
- Check OpenAI API key in `backend/.env`
- Make sure you selected `gpt-4o-mini` (not GPT-4)
- Check backend logs for error details

### No Visual Feedback
- Hard refresh the browser (Cmd+Shift+R)
- Make sure frontend restarted after code changes

### Execution Panel Doesn't Appear
- It only shows up after you click Execute
- Make sure WebSocket connection succeeded (check console)

## 🎨 Try Different Variations

### Analyze Different Repos

Change the API URL to analyze other repos:
- `https://api.github.com/repos/vercel/next.js`
- `https://api.github.com/repos/vuejs/vue`
- `https://api.github.com/repos/sveltejs/svelte`

### Different AI Analysis

Change the LLM prompt to:
```
Compare this repository to similar frameworks and explain why developers choose it:

{{repo_data}}
```

### Add More Nodes

Try adding:
- Another LLM node to summarize the analysis
- A conditional node to check if stars > 100k
- Multiple API calls to compare repos

## 📈 What You've Achieved

✅ Built a real-world AI workflow
✅ Integrated external APIs
✅ Used AI for data analysis
✅ Visual execution feedback
✅ Real-time logging
✅ Full workflow orchestration

## 🚀 Next Steps

Now that you have this working:

1. **Build more workflows** - Try the research agent (3 chained LLMs)
2. **Add more node types** - Code execution, databases, etc.
3. **Deploy it** - Export and run in production
4. **Share it** - Show off your visual AI workflows!

---

**Need help?** Check the logs in:
- Browser console (F12)
- Execution panel (bottom right)
- Backend terminal (uvicorn output)

**¡Disfruta construyendo workflows con IA!** 🎉
