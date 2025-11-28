from abc import ABC, abstractmethod
from typing import Dict, Any
from sqlalchemy.orm import Session
import httpx
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage

from app.core.config import settings


class NodeHandler(ABC):
    """Base class for node handlers"""

    def __init__(self, db: Session):
        self.db = db

    @abstractmethod
    async def execute(self, node: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the node and return updated state"""
        pass


class TriggerNodeHandler(NodeHandler):
    """Handler for trigger nodes"""

    async def execute(self, node: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
        """Trigger nodes just initialize the state"""
        node_data = node.get("data", {})

        # Add trigger message if provided
        if "message" in node_data:
            state["messages"].append({
                "role": "system",
                "content": node_data["message"]
            })

        state["current_node"] = node["id"]
        return state


class LLMNodeHandler(NodeHandler):
    """Handler for LLM nodes"""

    async def execute(self, node: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
        """Execute LLM call"""
        node_data = node.get("data", {})

        # Get configuration with proper defaults for None values
        provider = node_data.get("provider", "openai")
        model = node_data.get("model", "gpt-4")
        prompt = node_data.get("prompt", "")

        # Handle None values explicitly
        temperature = node_data.get("temperature")
        if temperature is None:
            temperature = 0.7

        max_tokens = node_data.get("max_tokens")
        if max_tokens is None:
            max_tokens = 1000

        # Replace variables in prompt from state
        formatted_prompt = self._format_prompt(prompt, state)

        # Get LLM instance
        llm = self._get_llm(provider, model, temperature, max_tokens)

        # Call LLM
        message = HumanMessage(content=formatted_prompt)
        response = await llm.ainvoke([message])

        # Store result in state
        result_key = node_data.get("output_key", "llm_output")
        state["data"][result_key] = response.content

        # Add to messages
        state["messages"].append({
            "role": "assistant",
            "content": response.content
        })

        state["current_node"] = node["id"]
        return state

    def _get_llm(self, provider: str, model: str, temperature: float, max_tokens: int):
        """Get LLM instance based on provider"""
        if provider == "openai":
            return ChatOpenAI(
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
                api_key=settings.OPENAI_API_KEY
            )
        elif provider == "anthropic":
            return ChatAnthropic(
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
                api_key=settings.ANTHROPIC_API_KEY
            )
        elif provider == "google":
            return ChatGoogleGenerativeAI(
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
                api_key=settings.GOOGLE_API_KEY
            )
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")

    def _format_prompt(self, prompt: str, state: Dict[str, Any]) -> str:
        """Format prompt with variables from state"""
        # Simple template replacement: {{variable}} -> state["data"]["variable"]
        import re

        def replace_var(match):
            var_name = match.group(1)
            return str(state.get("data", {}).get(var_name, f"{{{{ {var_name} }}}}"))

        return re.sub(r'\{\{(\w+)\}\}', replace_var, prompt)


class APINodeHandler(NodeHandler):
    """Handler for API call nodes"""

    async def execute(self, node: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
        """Execute API call"""
        node_data = node.get("data", {})

        # Get configuration
        url = node_data.get("url", "")
        method = node_data.get("method", "GET").upper()
        headers = node_data.get("headers", {})
        body = node_data.get("body", {})

        # Format URL and body with state variables
        url = self._format_string(url, state)

        # Make API call
        async with httpx.AsyncClient() as client:
            if method == "GET":
                response = await client.get(url, headers=headers)
            elif method == "POST":
                response = await client.post(url, headers=headers, json=body)
            elif method == "PUT":
                response = await client.put(url, headers=headers, json=body)
            elif method == "DELETE":
                response = await client.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

        # Store result
        result_key = node_data.get("output_key", "api_response")
        state["data"][result_key] = {
            "status_code": response.status_code,
            "body": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text,
            "headers": dict(response.headers)
        }

        state["current_node"] = node["id"]
        return state

    def _format_string(self, text: str, state: Dict[str, Any]) -> str:
        """Format string with variables from state"""
        import re

        def replace_var(match):
            var_name = match.group(1)
            return str(state.get("data", {}).get(var_name, f"{{{{ {var_name} }}}}"))

        return re.sub(r'\{\{(\w+)\}\}', replace_var, text)


class ConditionalNodeHandler(NodeHandler):
    """Handler for conditional nodes"""

    async def execute(self, node: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate condition"""
        node_data = node.get("data", {})

        # Get condition
        condition = node_data.get("condition", "")
        condition_type = node_data.get("condition_type", "simple")

        # For MVP, support simple conditions like "variable == value"
        # In production, use a safe expression evaluator
        if condition_type == "simple":
            result = self._evaluate_simple_condition(condition, state)
        else:
            result = False

        # Store result
        state["data"]["condition_result"] = result
        state["current_node"] = node["id"]

        return state

    def _evaluate_simple_condition(self, condition: str, state: Dict[str, Any]) -> bool:
        """Evaluate a simple condition"""
        # Parse condition like "variable == value"
        import re

        # Support: ==, !=, >, <, >=, <=
        match = re.match(r'(\w+)\s*(==|!=|>|<|>=|<=)\s*(.+)', condition.strip())

        if not match:
            return False

        var_name, operator, value = match.groups()
        var_value = state.get("data", {}).get(var_name)

        # Try to convert value to appropriate type
        try:
            if value.startswith('"') or value.startswith("'"):
                value = value.strip('"\'')
            elif value.lower() == "true":
                value = True
            elif value.lower() == "false":
                value = False
            elif "." in value:
                value = float(value)
            else:
                value = int(value)
        except:
            pass

        # Evaluate
        if operator == "==":
            return var_value == value
        elif operator == "!=":
            return var_value != value
        elif operator == ">":
            return var_value > value
        elif operator == "<":
            return var_value < value
        elif operator == ">=":
            return var_value >= value
        elif operator == "<=":
            return var_value <= value

        return False


class OutputNodeHandler(NodeHandler):
    """Handler for output nodes"""

    async def execute(self, node: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
        """Output node just marks the final state"""
        node_data = node.get("data", {})

        # Optionally format output
        output_format = node_data.get("format", "raw")

        if output_format == "json":
            # Already in dict format
            pass
        elif output_format == "text":
            # Convert to text if needed
            if "messages" in state:
                state["data"]["output_text"] = "\n".join(
                    [f"{msg['role']}: {msg['content']}" for msg in state["messages"]]
                )

        state["current_node"] = node["id"]
        return state


class NodeHandlerFactory:
    """Factory for creating node handlers"""

    def __init__(self, db: Session):
        self.db = db
        self.handlers = {
            "trigger": TriggerNodeHandler,
            "llm": LLMNodeHandler,
            "api": APINodeHandler,
            "conditional": ConditionalNodeHandler,
            "output": OutputNodeHandler,
        }

    def get_handler(self, node_type: str) -> NodeHandler:
        """Get handler for a node type"""
        handler_class = self.handlers.get(node_type)

        if not handler_class:
            raise ValueError(f"Unsupported node type: {node_type}")

        return handler_class(self.db)
