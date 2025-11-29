# E2B Custom Template Setup Guide

## Overview

This guide explains how to create and use a custom E2B template for FlowAI with pre-installed dependencies.

**Benefit:** Reduces workflow execution startup time from ~30 seconds to ~5 seconds by eliminating package installation.

## Prerequisites

1. E2B Account - [Sign up at e2b.dev](https://e2b.dev)
2. E2B API Key - Get from [E2B Dashboard](https://e2b.dev/dashboard)
3. E2B CLI installed

## Step 1: Install E2B CLI

```bash
# Using npm
npm install -g @e2b/cli

# Or using pip
pip install e2b-cli
```

## Step 2: Login to E2B

```bash
e2b auth login
```

This will open a browser window for authentication.

## Step 3: Build the Custom Template

Navigate to the backend directory and build the template:

```bash
cd backend
e2b template build
```

This will:
- Read `e2b.toml` configuration
- Build Docker image from `e2b.Dockerfile`
- Upload to E2B
- Return a template ID

**Example output:**
```
✓ Building template...
✓ Uploading template...
✓ Template built successfully!

Template ID: flowai-langgraph-abc123xyz
```

## Step 4: Copy Template ID

Save the template ID from the output. You'll need it for configuration.

## Step 5: Configure Backend

Add the template ID to your environment variables:

```bash
# In .env file
E2B_TEMPLATE_ID=flowai-langgraph-abc123xyz
```

Or update `backend/app/core/config.py`:

```python
class Settings(BaseSettings):
    # ... other settings ...
    E2B_TEMPLATE_ID: str = "flowai-langgraph-abc123xyz"
```

## Step 6: Update Executor Code

The executor code has been updated to use the custom template. Verify the changes in:
- `backend/app/services/executor/langgraph_executor.py`

## Step 7: Test

Run a workflow to verify:

```bash
# Start backend
cd backend
python -m uvicorn app.main:app --reload

# Execute a workflow from the UI
# Execution should be much faster!
```

## Updating the Template

If you need to update dependencies or configuration:

```bash
# 1. Edit e2b.Dockerfile or e2b.toml
# 2. Rebuild template
cd backend
e2b template build

# 3. Update template ID in config if it changed
```

## Troubleshooting

### Template build fails

- Check Docker is running
- Verify Dockerfile syntax
- Check E2B CLI is logged in: `e2b auth whoami`

### Sandbox creation fails

- Verify template ID is correct
- Check E2B API key is valid
- Verify template exists: `e2b template list`

### Dependencies missing

- Check Dockerfile has all required packages
- Rebuild template with updated dependencies
- Verify package versions are compatible

## Cost Considerations

- Custom templates are stored in E2B cloud
- No additional cost for template storage
- Sandbox usage is billed per second as usual
- Faster execution = lower costs overall

## Resources

- [E2B Documentation](https://e2b.dev/docs)
- [E2B Templates Guide](https://e2b.dev/docs/guide/templates)
- [E2B CLI Reference](https://e2b.dev/docs/cli/reference)
