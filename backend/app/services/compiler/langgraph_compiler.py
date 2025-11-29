from typing import Dict, Any, List
from jinja2 import Template


class LangGraphCompiler:
    """
    Compiles FlowAI workflows to executable LangGraph Python code.

    This compiler generates production-ready LangGraph code that can be:
    - Executed locally
    - Deployed to LangGraph Platform
    - Imported into LangGraph Studio for debugging
    """

    def __init__(self):
        self.template = self._load_template()

    def _sanitize_identifier(self, name: str) -> str:
        """Sanitize string to be a valid Python identifier"""
        import re
        # Replace invalid characters with underscore
        sanitized = re.sub(r'[^a-zA-Z0-9_]', '_', name)
        # Ensure it doesn't start with a number
        if sanitized[0].isdigit():
            sanitized = f"_{sanitized}"
        return sanitized

    def compile(self, workflow_data: Dict[str, Any]) -> str:
        """
        Compile FlowAI workflow to LangGraph Python code.

        Args:
            workflow_data: Dictionary containing:
                - name: Workflow name
                - state_schema: List of state field definitions (optional)
                - nodes: List of node definitions
                - edges: List of edge definitions

        Returns:
            Executable Python code as string
        """
        workflow_name = workflow_data.get("name", "Untitled Workflow")
        state_schema = workflow_data.get("state_schema", [])
        nodes = workflow_data.get("nodes", [])
        edges = workflow_data.get("edges", [])

        # Provide default state schema if empty (backward compatibility)
        using_default_schema = False
        if not state_schema or len(state_schema) == 0:
            print("⚠️ No state schema defined, using default")
            using_default_schema = True
            state_schema = [
                {
                    "name": "messages",
                    "type": "list",
                    "reducer": "add_messages",
                    "description": "Conversation history"
                },
                {
                    "name": "data",
                    "type": "dict",
                    "reducer": "none",
                    "description": "General purpose data storage"
                }
            ]

        # Infer additional state fields from node outputs
        # This ensures that variables like 'dataset_df' or 'llm_output' are valid in the state
        existing_fields = {f["name"] for f in state_schema}
        
        for node in nodes:
            config = node.get("data", {})
            output_key = config.get("output_key")
            
            # If node has an output key and it's not in schema, add it
            if output_key:
                # Sanitize the key
                sanitized_key = self._sanitize_identifier(output_key)
                
                if sanitized_key not in existing_fields:
                    print(f"ℹ️ Inferring state field '{sanitized_key}' from node '{node['id']}'")
                    state_schema.append({
                        "name": sanitized_key,
                        "type": "Any",  # Use Any to be safe
                        "reducer": "none",
                        "description": f"Output from node {node['id']}"
                    })
                    existing_fields.add(sanitized_key)
            
            # Also handle default output keys if not explicitly set
            if not output_key:
                node_id = node["id"]
                default_key = None
                
                if node["type"] == "dataset":
                    default_key = f"{node_id}_df"
                elif node["type"] == "llm":
                    default_key = f"{node_id}_output"
                    
                if default_key:
                    sanitized_key = self._sanitize_identifier(default_key)
                    
                    if sanitized_key not in existing_fields:
                        print(f"ℹ️ Inferring default state field '{sanitized_key}' from node '{node['id']}'")
                        state_schema.append({
                            "name": sanitized_key,
                            "type": "Any",
                            "reducer": "none",
                            "description": f"Default output from node {node['id']}"
                        })
                        existing_fields.add(sanitized_key)

        # Validate
        validation_warnings = self._validate(state_schema, nodes, edges)

        # Log warnings but don't fail (allow compilation)
        if validation_warnings:
            for warning in validation_warnings:
                print(f"⚠️ Warning: {warning}")

        # Generate components
        imports = self._generate_imports(state_schema, nodes)
        state_class = self._generate_state_class(state_schema)
        node_functions = self._generate_node_functions(nodes)
        routing_functions = self._generate_routing_functions(edges)
        graph_construction = self._generate_graph_construction(nodes, edges)

        # Render template
        code = self.template.render(
            workflow_name=workflow_name,
            imports=imports,
            state_class=state_class,
            node_functions=node_functions,
            routing_functions=routing_functions,
            graph_construction=graph_construction,
            using_default_schema=using_default_schema
        )

        return code

    def _validate(self, state_schema: List[Dict], nodes: List[Dict], edges: List[Dict]):
        """Validate workflow structure and return warnings"""
        errors = []
        warnings = []

        # State schema is optional - we'll provide a default if empty
        # This allows backward compatibility with old workflows

        # Check for duplicate field names if state schema exists
        if state_schema and len(state_schema) > 0:
            field_names = [f["name"] for f in state_schema]
            if len(field_names) != len(set(field_names)):
                errors.append("Duplicate field names in state schema")

        # Check nodes
        if not nodes or len(nodes) == 0:
            errors.append("No nodes defined")

        # Check for duplicate node IDs
        if nodes:
            node_ids = [n["id"] for n in nodes]
            if len(node_ids) != len(set(node_ids)):
                errors.append("Duplicate node IDs")

        # Check edges reference valid nodes
        if nodes and edges:
            node_ids_set = set(n["id"] for n in nodes)
            for edge in edges:
                if edge["source"] not in node_ids_set:
                    errors.append(f"Edge source '{edge['source']}' not found")
                if edge["target"] not in node_ids_set:
                    errors.append(f"Edge target '{edge['target']}' not found")

        # Check for variable usage in prompts
        if state_schema and nodes:
            state_field_names = set(f["name"] for f in state_schema)

            import re
            for node in nodes:
                if node.get("type") == "llm":
                    prompt = node.get("data", {}).get("prompt", "")
                    if prompt:
                        # Find all {{variable}} references
                        variables = re.findall(r'\{\{(\w+)\}\}', prompt)
                        for var in variables:
                            if var not in state_field_names:
                                warnings.append(
                                    f"Node '{node['id']}': Prompt references '{{{{var}}}}' but '{var}' is not in state schema"
                                )

        if errors:
            raise ValueError("Validation errors:\n" + "\n".join(errors))

        return warnings

    def _generate_imports(self, state_schema: List[Dict], nodes: List[Dict]) -> str:
        """Generate import statements"""
        imports = [
            "from typing import TypedDict, Annotated, Any",
            "from langgraph.graph import StateGraph, START, END",
        ]

        # Check if we need add_messages
        needs_add_messages = any(
            f.get("reducer") == "add_messages"
            for f in state_schema
        )
        if needs_add_messages:
            imports.append("from langgraph.graph.message import add_messages")

        # Check if we need operator.add
        needs_add = any(
            f.get("reducer") == "add"
            for f in state_schema
        )
        if needs_add:
            imports.append("from operator import add")

        # Check for LLM nodes
        has_llm_nodes = any(n["type"] == "llm" for n in nodes)
        if has_llm_nodes:
            imports.extend([
                "from langchain_openai import ChatOpenAI",
                "from langchain_anthropic import ChatAnthropic",
                "from langchain_google_genai import ChatGoogleGenerativeAI",
                "from langchain_core.messages import HumanMessage, AIMessage",
                "import os",
            ])

        # Check for API nodes
        has_api_nodes = any(n["type"] == "api" for n in nodes)
        if has_api_nodes:
            imports.append("import httpx")

        # Check for Dataset nodes
        has_dataset_nodes = any(n["type"] == "dataset" for n in nodes)
        if has_dataset_nodes:
            imports.append("import pandas as pd")
            imports.append("import io")

        return "\n".join(imports)

    def _generate_state_class(self, state_schema: List[Dict]) -> str:
        """Generate state TypedDict class"""
        lines = [
            "class WorkflowState(TypedDict):",
            '    """Generated state schema for the workflow"""',
        ]

        for field in state_schema:
            field_name = field["name"]
            field_type = self._map_type(field["type"])
            reducer = field.get("reducer", "none")

            if reducer == "add":
                lines.append(f"    {field_name}: Annotated[{field_type}, add]")
            elif reducer == "add_messages":
                lines.append(f"    {field_name}: Annotated[list, add_messages]")
            elif reducer == "custom" and field.get("customReducer"):
                # For custom reducers, we'd need to define them
                # For MVP, fall back to no reducer
                lines.append(f"    {field_name}: {field_type}")
            else:
                lines.append(f"    {field_name}: {field_type}")

        return "\n".join(lines)

    def _map_type(self, flowai_type: str) -> str:
        """Map FlowAI type to Python type"""
        mapping = {
            "str": "str",
            "int": "int",
            "float": "float",
            "bool": "bool",
            "list": "list",
            "dict": "dict",
            "Any": "Any"
        }
        return mapping.get(flowai_type, "Any")

    def _normalize_provider(self, provider: str) -> str:
        """Normalize provider name to lowercase standard format"""
        provider = provider.lower().strip()

        # Map common variations
        provider_map = {
            "openai": "openai",
            "open ai": "openai",
            "gpt": "openai",
            "anthropic": "anthropic",
            "claude": "anthropic",
            "google": "google",
            "gemini": "google",
            "palm": "google"
        }

        return provider_map.get(provider, "openai")

    def _normalize_model(self, model: str, provider: str) -> str:
        """Normalize model name to standard format"""
        model = model.lower().strip()

        # OpenAI model mappings
        if provider == "openai":
            model_map = {
                "gpt-4": "gpt-4",
                "gpt4": "gpt-4",
                "gpt-4-turbo": "gpt-4-turbo",
                "gpt-3.5-turbo": "gpt-3.5-turbo",
                "gpt-3.5": "gpt-3.5-turbo",
                "gpt3.5": "gpt-3.5-turbo",
            }
            return model_map.get(model, model)

        # Anthropic model mappings
        elif provider == "anthropic":
            model_map = {
                "claude-3-opus": "claude-3-opus-20240229",
                "claude-opus": "claude-3-opus-20240229",
                "claude-3-sonnet": "claude-3-sonnet-20240229",
                "claude-sonnet": "claude-3-sonnet-20240229",
                "claude-3-haiku": "claude-3-haiku-20240307",
                "claude-haiku": "claude-3-haiku-20240307",
            }
            return model_map.get(model, model)

        # Google model mappings
        elif provider == "google":
            model_map = {
                "gemini-pro": "gemini-pro",
                "gemini": "gemini-pro",
                "gemini-1.5-pro": "gemini-1.5-pro",
            }
            return model_map.get(model, model)

        return model

    def _generate_node_functions(self, nodes: List[Dict]) -> str:
        """Generate node function definitions"""
        functions = []

        for node in nodes:
            if node["type"] == "llm":
                func = self._generate_llm_node(node)
            elif node["type"] == "api":
                func = self._generate_api_node(node)
            elif node["type"] == "trigger":
                func = self._generate_trigger_node(node)
            elif node["type"] == "output":
                func = self._generate_output_node(node)
            elif node["type"] == "conditional":
                func = self._generate_conditional_node(node)
            elif node["type"] == "dataset":
                func = self._generate_dataset_node(node)
            else:
                func = self._generate_generic_node(node)

            functions.append(func)

        return "\n\n".join(functions)

    def _generate_llm_node(self, node: Dict) -> str:
        """Generate LLM node function"""
        node_id = node["id"]
        config = node.get("data", {})
        provider_raw = config.get("provider", "openai")
        model_raw = config.get("model", "gpt-4")
        prompt = config.get("prompt", "")
        output_key = config.get("output_key", "llm_output")

        # Normalize provider name
        provider = self._normalize_provider(provider_raw)

        # Normalize model name
        model = self._normalize_model(model_raw, provider)

        # Handle empty output_key
        if not output_key or output_key.strip() == "":
            output_key = f"{node_id}_output"
            
        # Sanitize output key
        output_key = self._sanitize_identifier(output_key)

        return f'''def {node_id}(state: WorkflowState) -> dict:
    """
    LLM Node: {node_id}
    Provider: {provider}
    Model: {model}
    """
    import sys
    import json
    from datetime import datetime
    
    # Log node start
    print(json.dumps({{
        "type": "NODE_START",
        "node_id": "{node_id}",
        "node_type": "llm",
        "timestamp": datetime.utcnow().isoformat()
    }}), file=sys.stderr, flush=True)
    
    try:
        # Initialize LLM
        if "{provider}" == "openai":
            llm = ChatOpenAI(
                model="{model}",
                api_key=os.getenv("OPENAI_API_KEY")
            )
        elif "{provider}" == "anthropic":
            llm = ChatAnthropic(
                model="{model}",
                api_key=os.getenv("ANTHROPIC_API_KEY")
            )
        elif "{provider}" == "google":
            llm = ChatGoogleGenerativeAI(
                model="{model}",
                api_key=os.getenv("GOOGLE_API_KEY")
            )
        else:
            raise ValueError(f"Unknown provider: {provider}")

        # Format prompt with state variables
        prompt_template = """{prompt}"""

        # Simple variable substitution ({{var}} -> state[var])
        import re
        def replace_var(match):
            var_name = match.group(1)
            return str(state.get(var_name, f"{{{{{{{{{{var_name}}}}}}}}}}"))

        formatted_prompt = re.sub(r'\\{{\\{{(\\w+)\\}}\\}}', replace_var, prompt_template)

        # Call LLM
        message = HumanMessage(content=formatted_prompt)
        response = llm.invoke([message])
        
        # Log node completion
        print(json.dumps({{
            "type": "NODE_COMPLETE",
            "node_id": "{node_id}",
            "node_type": "llm",
            "timestamp": datetime.utcnow().isoformat()
        }}), file=sys.stderr, flush=True)

        # Return state update
        return {{
            "{output_key}": response.content,
            "messages": [AIMessage(content=response.content)] if "messages" in state else []
        }}
        
    except Exception as e:
        # Log node error
        print(json.dumps({{
            "type": "NODE_ERROR",
            "node_id": "{node_id}",
            "node_type": "llm",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }}), file=sys.stderr, flush=True)
        raise'''

    def _generate_api_node(self, node: Dict) -> str:
        """Generate API node function"""
        node_id = node["id"]
        config = node.get("data", {})
        url = config.get("url", "")
        method = config.get("method", "GET")
        output_key = config.get("output_key", "api_response")
        
        # Sanitize output key
        if output_key:
            output_key = self._sanitize_identifier(output_key)

        return f'''def {node_id}(state: WorkflowState) -> dict:
    """API Node: {node_id}"""
    import sys
    import json
    from datetime import datetime
    
    # Log node start
    print(json.dumps({{
        "type": "NODE_START",
        "node_id": "{node_id}",
        "node_type": "api",
        "timestamp": datetime.utcnow().isoformat()
    }}), file=sys.stderr, flush=True)
    
    try:
        # Format URL with state variables
        import re
        url_template = "{url}"

        def replace_var(match):
            var_name = match.group(1)
            return str(state.get(var_name, f"{{{{{{{{{{var_name}}}}}}}}}}"))

        formatted_url = re.sub(r'\\{{\\{{(\\w+)\\}}\\}}', replace_var, url_template)

        # Make API call
        with httpx.Client() as client:
            if "{method}" == "GET":
                response = client.get(formatted_url)
            elif "{method}" == "POST":
                response = client.post(formatted_url, json={{}})
            else:
                raise ValueError(f"Unsupported method: {method}")

            response.raise_for_status()
            
            result = {{
                "{output_key}": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
            }}
            
            # Log node completion
            print(json.dumps({{
                "type": "NODE_COMPLETE",
                "node_id": "{node_id}",
                "node_type": "api",
                "timestamp": datetime.utcnow().isoformat()
            }}), file=sys.stderr, flush=True)
            
            return result
            
    except Exception as e:
        # Log node error
        print(json.dumps({{
            "type": "NODE_ERROR",
            "node_id": "{node_id}",
            "node_type": "api",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }}), file=sys.stderr, flush=True)
        raise'''

    def _generate_trigger_node(self, node: Dict) -> str:
        """Generate trigger node function"""
        node_id = node["id"]
        config = node.get("data", {})
        message = config.get("message", "")

        # If message is empty, just pass through state
        if not message or message.strip() == "":
            return f'''def {node_id}(state: WorkflowState) -> dict:
    """Trigger Node: {node_id}"""
    import sys
    import json
    from datetime import datetime
    
    # Log node start
    print(json.dumps({{
        "type": "NODE_START",
        "node_id": "{node_id}",
        "node_type": "trigger",
        "timestamp": datetime.utcnow().isoformat()
    }}), file=sys.stderr, flush=True)
    
    # Log node completion
    print(json.dumps({{
        "type": "NODE_COMPLETE",
        "node_id": "{node_id}",
        "node_type": "trigger",
        "timestamp": datetime.utcnow().isoformat()
    }}), file=sys.stderr, flush=True)
    
    # Entry point - pass through initial state
    return state'''

        return f'''def {node_id}(state: WorkflowState) -> dict:
    """Trigger Node: {node_id}"""
    import sys
    import json
    from datetime import datetime
    
    # Log node start
    print(json.dumps({{
        "type": "NODE_START",
        "node_id": "{node_id}",
        "node_type": "trigger",
        "timestamp": datetime.utcnow().isoformat()
    }}), file=sys.stderr, flush=True)
    
    # Initialize workflow with message
    result = {{}}

    if "messages" in state:
        result["messages"] = [HumanMessage(content="{message}")]
    
    # Log node completion
    print(json.dumps({{
        "type": "NODE_COMPLETE",
        "node_id": "{node_id}",
        "node_type": "trigger",
        "timestamp": datetime.utcnow().isoformat()
    }}), file=sys.stderr, flush=True)
    
    return result'''

    def _generate_output_node(self, node: Dict) -> str:
        """Generate output node function"""
        node_id = node["id"]

        return f'''def {node_id}(state: WorkflowState) -> dict:
    """Output Node: {node_id}"""
    import sys
    import json
    from datetime import datetime
    
    # Log node start
    print(json.dumps({{
        "type": "NODE_START",
        "node_id": "{node_id}",
        "node_type": "output",
        "timestamp": datetime.utcnow().isoformat()
    }}), file=sys.stderr, flush=True)
    
    # Log node completion
    print(json.dumps({{
        "type": "NODE_COMPLETE",
        "node_id": "{node_id}",
        "node_type": "output",
        "timestamp": datetime.utcnow().isoformat()
    }}), file=sys.stderr, flush=True)
    
    # Final output node - just pass through state
    return {{}}'''

    def _generate_conditional_node(self, node: Dict) -> str:
        """Generate conditional node function"""
        node_id = node["id"]
        config = node.get("data", {})
        condition = config.get("condition", "")

        return f'''def {node_id}(state: WorkflowState) -> dict:
    """Conditional Node: {node_id}"""
    import sys
    import json
    from datetime import datetime
    
    # Log node start
    print(json.dumps({{
        "type": "NODE_START",
        "node_id": "{node_id}",
        "node_type": "conditional",
        "timestamp": datetime.utcnow().isoformat()
    }}), file=sys.stderr, flush=True)
    
    # Evaluate condition: {condition}
    # TODO: Implement condition evaluation
    result = False
    
    # Log node completion
    print(json.dumps({{
        "type": "NODE_COMPLETE",
        "node_id": "{node_id}",
        "node_type": "conditional",
        "timestamp": datetime.utcnow().isoformat()
    }}), file=sys.stderr, flush=True)
    
    return {{"condition_result": result}}'''

    def _generate_dataset_node(self, node: Dict) -> str:
        """Generate dataset node function"""
        node_id = node["id"]
        config = node.get("data", {})
        dataset_id = config.get("dataset_id", "")
        output_key = config.get("output_key", "dataset_df")

        # Handle empty output_key
        if not output_key or output_key.strip() == "":
            output_key = f"{node_id}_df"
            
        # Sanitize output key
        output_key = self._sanitize_identifier(output_key)

        # The file will be uploaded to this path by the executor
        file_path = f"/home/user/datasets/{dataset_id}.csv"

        return f'''def {node_id}(state: WorkflowState) -> dict:
    """Dataset Node: {node_id}"""
    import sys
    import json
    import pandas as pd
    from datetime import datetime
    import os
    
    # Log node start
    print(json.dumps({{
        "type": "NODE_START",
        "node_id": "{node_id}",
        "node_type": "dataset",
        "timestamp": datetime.utcnow().isoformat()
    }}), file=sys.stderr, flush=True)
    
    try:
        # Check if file exists
        file_path = "{file_path}"
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Dataset file not found at {{file_path}}")

        # Read dataset using pandas
        # Try reading as CSV first
        try:
            df = pd.read_csv(file_path)
        except:
            # Fallback to JSON if CSV fails
            df = pd.read_json(file_path)
            
        # Convert to list of dicts for JSON serialization/state storage
        # This makes it compatible with LLM prompts and other nodes
        data = df.to_dict(orient="records")
        
        # Log node completion
        print(json.dumps({{
            "type": "NODE_COMPLETE",
            "node_id": "{node_id}",
            "node_type": "dataset",
            "timestamp": datetime.utcnow().isoformat()
        }}), file=sys.stderr, flush=True)
        
        return {{
            "{output_key}": data
        }}
        
    except Exception as e:
        # Log node error
        print(json.dumps({{
            "type": "NODE_ERROR",
            "node_id": "{node_id}",
            "node_type": "dataset",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }}), file=sys.stderr, flush=True)
        raise'''

    def _generate_generic_node(self, node: Dict) -> str:
        """Generate generic node function"""
        node_id = node["id"]
        node_type = node["type"]

        return f'''def {node_id}(state: WorkflowState) -> dict:
    """Node: {node_id} (type: {node_type})"""
    # TODO: Implement {node_type} node logic
    return {{}}'''

    def _generate_routing_functions(self, edges: List[Dict]) -> str:
        """Generate routing functions for conditional edges"""
        # Group edges by source to find conditional routing
        edges_by_source = {}
        for edge in edges:
            source = edge["source"]
            if source not in edges_by_source:
                edges_by_source[source] = []
            edges_by_source[source].append(edge)

        functions = []

        for source, source_edges in edges_by_source.items():
            # Check if any edges from this source are conditional
            conditional_edges = [e for e in source_edges if e.get("type") == "conditional"]

            if not conditional_edges:
                continue  # Skip non-conditional sources

            # Generate routing function for this source
            function_name = f"route_from_{source}"

            lines = [
                f"def {function_name}(state: WorkflowState) -> str:",
                f'    """',
                f'    Routing logic from {source}',
                f'    Evaluates conditions and returns the branch to take',
                f'    """'
            ]

            # Get routing data from the first conditional edge (they share same source)
            # In practice, conditional edges from same source should have consistent routing data
            for edge in conditional_edges:
                edge_data = edge.get("data") or {}
                routes = edge_data.get("routes", [])
                default_target = edge_data.get("defaultTarget")

                if not routes:
                    continue

                # Generate if/elif chain
                for i, route in enumerate(routes):
                    expression = route.get("expression", "")
                    output = route.get("output", "")

                    if not expression or not output:
                        continue

                    if i == 0:
                        lines.append(f"    if {expression}:")
                    else:
                        lines.append(f"    elif {expression}:")

                    lines.append(f'        return "{output}"')

                # Default case
                if default_target:
                    lines.append(f"    else:")
                    lines.append(f'        return "default"')
                else:
                    # If no default, raise an error
                    lines.append(f"    else:")
                    lines.append(f'        raise ValueError("No routing condition matched and no default route specified")')

                break  # Only process first conditional edge (they should be consistent)

            functions.append("\n".join(lines))

        return "\n\n".join(functions) if functions else ""

    def _generate_graph_construction(self, nodes: List[Dict], edges: List[Dict]) -> str:
        """Generate graph construction code"""
        lines = [
            "# Create graph",
            "workflow = StateGraph(WorkflowState)",
            "",
            "# Add nodes",
        ]

        # Add all nodes
        for node in nodes:
            lines.append(f'workflow.add_node("{node["id"]}", {node["id"]})')

        lines.append("")
        lines.append("# Add edges")

        # Find trigger node for entry point
        trigger_nodes = [n for n in nodes if n["type"] == "trigger"]
        if trigger_nodes:
            entry_node = trigger_nodes[0]["id"]
            lines.append(f'workflow.add_edge(START, "{entry_node}")')

        # Filter out None edges (defensive programming)
        print(f"\n🔍 DEBUG: Edge Validation")
        print(f"Total edges received: {len(edges)}")
        none_edges_count = sum(1 for e in edges if e is None)
        if none_edges_count > 0:
            print(f"⚠️ WARNING: Found {none_edges_count} None edges in the edges list!")
            print(f"   This suggests an issue with how edges are being created/stored")
            for i, edge in enumerate(edges):
                if edge is None:
                    print(f"   - Edge at index {i} is None")
        
        # Filter out None edges
        edges = [e for e in edges if e is not None]
        print(f"Valid edges after filtering: {len(edges)}")
        
        # Group edges by source
        edges_by_source = {}
        for edge in edges:
            source = edge["source"]
            if source not in edges_by_source:
                edges_by_source[source] = []
            edges_by_source[source].append(edge)

        # DEBUG: Log all edges and their types
        print("\n🔍 DEBUG: Edge Analysis")
        print(f"Total edges: {len(edges)}")
        for edge in edges:
            edge_type = edge.get("type", "default")
            print(f"  Edge {edge['id']}: {edge['source']} → {edge['target']} (type: {edge_type})")
            if edge_type == "conditional":
                routes = edge.get("data", {}).get("routes", [])
                print(f"    Routes: {len(routes)}")
                for route in routes:
                    print(f"      - {route.get('label')}: {route.get('expression')} → {route.get('target')}")

        # Process each source
        processed_sources = set()

        for source, source_edges in edges_by_source.items():
            if source in processed_sources:
                continue

            # Check if this source has conditional edges
            conditional_edges = [e for e in source_edges if e.get("type") == "conditional"]

            print(f"\n🔍 Processing source '{source}':")
            print(f"  Total edges from this source: {len(source_edges)}")
            print(f"  Conditional edges: {len(conditional_edges)}")
            print(f"  Edge types: {[e.get('type', 'default') for e in source_edges]}")

            if conditional_edges:
                # Use conditional routing
                print(f"  ✅ Using CONDITIONAL ROUTING for source '{source}'")
                edge_data = conditional_edges[0].get("data") or {}
                routes = edge_data.get("routes", [])
                default_target = edge_data.get("defaultTarget")

                if routes:
                    # Build path map: output -> target
                    path_map = {}
                    for route in routes:
                        output = route.get("output", "")
                        target = route.get("target", "")
                        if output and target:
                            path_map[output] = target

                    if default_target:
                        path_map["default"] = default_target

                    print(f"  Path map: {path_map}")

                    lines.append("")
                    lines.append(f"# Conditional routing from {source}")
                    lines.append(f"workflow.add_conditional_edges(")
                    lines.append(f'    "{source}",')
                    lines.append(f'    route_from_{source},')
                    lines.append(f'    {path_map}')
                    lines.append(f")")

                    processed_sources.add(source)
                else:
                    print(f"  ⚠️ WARNING: Conditional edges found but no routes defined!")
            else:
                # Normal edges
                print(f"  ➡️  Using NORMAL EDGES for source '{source}'")
                for edge in source_edges:
                    target = edge["target"]
                    print(f"    Adding edge: {source} → {target}")
                    lines.append(f'workflow.add_edge("{source}", "{target}")')

                processed_sources.add(source)

        # Find output node for exit
        output_nodes = [n for n in nodes if n["type"] == "output"]
        if output_nodes:
            for output_node in output_nodes:
                lines.append(f'workflow.add_edge("{output_node["id"]}", END)')

        lines.extend([
            "",
            "# Compile graph",
            "app = workflow.compile()",
        ])

        return "\n".join(lines)

    def _load_template(self) -> Template:
        """Load Jinja2 template for code generation"""
        template_str = '''"""
Auto-generated LangGraph Workflow
===================================
Workflow: {{ workflow_name }}
Generated by: FlowAI (https://github.com/yourusername/flowai)

DESCRIPTION:
    This file contains a complete, executable LangGraph workflow.
    It can be run directly with Python or deployed to LangGraph Platform.

USAGE:
    # Run locally:
    python {{ workflow_name.replace(" ", "_") }}_langgraph.py

    # Deploy to LangGraph Platform:
    langchain app add {{ workflow_name.replace(" ", "_") }}_langgraph.py

REQUIREMENTS:
    pip install langgraph langchain-openai langchain-anthropic langchain-google-genai

ENVIRONMENT VARIABLES:
    OPENAI_API_KEY      - Required for OpenAI models
    ANTHROPIC_API_KEY   - Required for Anthropic/Claude models
    GOOGLE_API_KEY      - Required for Google/Gemini models
"""

{{ imports }}

# ============================================================================
# STATE DEFINITION
# ============================================================================
# The state defines what data flows through your workflow.
# Each node can read from and write to the state.
# Reducers control how updates are merged (replace, add, add_messages, etc.)
{% if using_default_schema %}
#
# ⚠️  NOTE: This workflow uses a default state schema.
# To customize the state, open FlowAI and click "State Schema" to add your fields.
{% endif %}

{{ state_class }}

# ============================================================================
# NODE DEFINITIONS
# ============================================================================
# Each function below represents a node in your workflow.
# Nodes receive the current state and return updates to merge into state.

{{ node_functions }}

{{ routing_functions }}

# ============================================================================
# GRAPH CONSTRUCTION
# ============================================================================
# This section builds the LangGraph StateGraph and defines the execution flow.

{{ graph_construction }}

# ============================================================================
# EXECUTION
# ============================================================================
# Example of how to run this workflow locally.
# Modify initial_state to provide inputs to your workflow.

if __name__ == "__main__":
    # Define initial state with any required inputs
    initial_state = {
        # Add your initial values here
        # Example: "topic": "AI agents", "query": "What is LangGraph?"
    }

    print("🚀 Starting workflow execution...")
    print(f"📊 Initial state: {initial_state}")
    print()

    # Run the workflow
    result = app.invoke(initial_state)

    print()
    print("✅ Execution completed!")
    print("=" * 60)
    print("📤 Final state:")
    for key, value in result.items():
        print(f"  {key}: {value}")
'''
        return Template(template_str)
