# E2B Custom Template for FlowAI
# This Dockerfile creates a custom E2B sandbox with all LangGraph dependencies pre-installed
# This eliminates the need to install packages on every execution, reducing startup time from ~30s to ~5s

FROM python:3.11-slim

# Set working directory
WORKDIR /code

# Update system packages
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip

# Install LangGraph and LangChain dependencies
# These are the exact packages we need for workflow execution
RUN pip install --no-cache-dir \
    langgraph==0.2.28 \
    langchain-core==0.3.15 \
    langchain-openai==0.2.9 \
    langchain-anthropic==0.2.4 \
    langchain-google-genai==2.0.4 \
    httpx==0.27.2

# Verify installations
RUN python -c "import langgraph; import langchain_core; import langchain_openai; import langchain_anthropic; import langchain_google_genai; import httpx; print('✅ All dependencies installed successfully')"

# Set Python to run in unbuffered mode (important for real-time logs)
ENV PYTHONUNBUFFERED=1

# Default command
CMD ["python"]
