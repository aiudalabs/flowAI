# Recompile Workflows Script

## Purpose

This script recompiles all existing workflows in the database with the latest compiler code. This is useful after making changes to the `LangGraphCompiler` to apply those changes to workflows that were already saved.

## When to Use

Run this script when:
- ✅ You've updated the code generation logic in `LangGraphCompiler`
- ✅ You've added new logging or debugging features
- ✅ You've fixed bugs in generated code
- ✅ You want to ensure all workflows use the latest code format

## Usage

### Method 1: Run Directly (Recommended)

```bash
cd backend
python scripts/recompile_workflows.py
```

### Method 2: As Module

```bash
cd backend
python -m scripts.recompile_workflows
```

## Example Output

```
🚀 Starting workflow recompilation...

📊 Found 3 workflows to recompile
============================================================

🔧 Recompiling: Customer Support Workflow
   ID: 550e8400-e29b-41d4-a716-446655440000
   Nodes: 4, Edges: 3
   ✅ Successfully recompiled

🔧 Recompiling: Data Analysis Pipeline
   ID: 6ba7b810-9dad-11d1-80b4-00c04fd430c8
   Nodes: 5, Edges: 4
   ✅ Successfully recompiled

🔧 Recompiling: Content Generator
   ID: 7193b450-9dad-11d1-80b4-00c04fd430c9
   Nodes: 3, Edges: 2
   ✅ Successfully recompiled

============================================================
📈 RECOMPILATION SUMMARY
============================================================
✅ Successful: 3
❌ Errors: 0
📊 Total: 3

🎉 All workflows recompiled successfully!
```

## What It Does

1. **Connects** to the database using `DATABASE_URL` from settings
2. **Fetches** all workflows from the `workflows` table
3. **Recompiles** each workflow using `LangGraphCompiler`
4. **Updates** the `compiled_code` field in the database
5. **Reports** success/failure for each workflow

## Safety

- ✅ **Non-destructive**: Only updates the `compiled_code` field
- ✅ **Transactional**: Each workflow update is a separate transaction
- ✅ **Rollback on error**: Failed updates don't affect successful ones
- ✅ **Preserves graph_data**: Original workflow definition is unchanged

## Troubleshooting

### "No workflows found in database"
- Database is empty or connection failed
- Check `DATABASE_URL` in `.env`

### "Error: validation failed"
- Workflow has invalid graph structure
- Fix the workflow in the UI and recompile again

### "ModuleNotFoundError"
- Run from `backend/` directory
- Ensure virtual environment is activated

## Notes

- Workflows must be re-saved manually to trigger WebSocket updates in the UI
- Running this script does NOT affect running executions
- Safe to run multiple times (idempotent)

## Integration with CI/CD

You can add this to your deployment pipeline:

```bash
# After deploying new backend code
python scripts/recompile_workflows.py
```

This ensures all workflows use the latest compiler logic immediately after deployment.
