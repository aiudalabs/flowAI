#!/usr/bin/env python3
"""
Test script to export the conditional workflow and see debug logs
"""
import json
import requests

# The conditional workflow template
conditional_workflow = {
    "name": "Customer Support Router",
    "state_schema": [
        {
            "name": "customer_message",
            "type": "str",
            "reducer": "none",
            "description": "Original customer message"
        },
        {
            "name": "sentiment",
            "type": "str",
            "reducer": "none",
            "description": "Detected sentiment (positive, negative, neutral)"
        },
        {
            "name": "response",
            "type": "str",
            "reducer": "none",
            "description": "Generated response based on sentiment"
        },
        {
            "name": "messages",
            "type": "list",
            "reducer": "add_messages",
            "description": "Conversation history"
        }
    ],
    "nodes": [
        {
            "id": "trigger_1",
            "type": "trigger",
            "position": {"x": 100, "y": 250},
            "data": {
                "label": "Start",
                "message": "Customer support request received"
            }
        },
        {
            "id": "llm_1",
            "type": "llm",
            "position": {"x": 350, "y": 250},
            "data": {
                "label": "Analyze Sentiment",
                "provider": "openai",
                "model": "gpt-4",
                "prompt": """Analyze the sentiment of this customer message and respond with ONLY one word: "positive", "negative", or "neutral".

Customer message: {{customer_message}}

Sentiment:""",
                "output_key": "sentiment"
            }
        },
        {
            "id": "llm_2",
            "type": "llm",
            "position": {"x": 700, "y": 100},
            "data": {
                "label": "Positive Response",
                "provider": "openai",
                "model": "gpt-4",
                "prompt": """The customer has a positive sentiment. Generate an enthusiastic, helpful response to their message.

Customer message: {{customer_message}}

Response:""",
                "output_key": "response"
            }
        },
        {
            "id": "llm_3",
            "type": "llm",
            "position": {"x": 700, "y": 250},
            "data": {
                "label": "Negative Response",
                "provider": "openai",
                "model": "gpt-4",
                "prompt": """The customer has a negative sentiment. Generate an empathetic, apologetic response that shows we understand their frustration.

Customer message: {{customer_message}}

Response:""",
                "output_key": "response"
            }
        },
        {
            "id": "llm_4",
            "type": "llm",
            "position": {"x": 700, "y": 400},
            "data": {
                "label": "Neutral Response",
                "provider": "openai",
                "model": "gpt-4",
                "prompt": """The customer has a neutral sentiment. Generate a professional, informative response.

Customer message: {{customer_message}}

Response:""",
                "output_key": "response"
            }
        },
        {
            "id": "output_1",
            "type": "output",
            "position": {"x": 1000, "y": 250},
            "data": {
                "label": "Final Output"
            }
        }
    ],
    "edges": [
        {
            "id": "e1",
            "source": "trigger_1",
            "target": "llm_1",
            "type": "smoothstep"
        },
        # Conditional edges - one for each route
        {
            "id": "e2-positive",
            "source": "llm_1",
            "target": "llm_2",
            "type": "conditional",
            "label": "If Positive",
            "data": {
                "routes": [
                    {
                        "label": "If Positive",
                        "expression": "state['sentiment'].strip().lower() == 'positive'",
                        "output": "positive",
                        "target": "llm_2"
                    },
                    {
                        "label": "If Negative",
                        "expression": "state['sentiment'].strip().lower() == 'negative'",
                        "output": "negative",
                        "target": "llm_3"
                    },
                    {
                        "label": "If Neutral",
                        "expression": "state['sentiment'].strip().lower() == 'neutral'",
                        "output": "neutral",
                        "target": "llm_4"
                    }
                ],
                "defaultTarget": "llm_4"
            }
        },
        {
            "id": "e2-negative",
            "source": "llm_1",
            "target": "llm_3",
            "type": "conditional",
            "label": "If Negative",
            "data": {
                "routes": [
                    {
                        "label": "If Positive",
                        "expression": "state['sentiment'].strip().lower() == 'positive'",
                        "output": "positive",
                        "target": "llm_2"
                    },
                    {
                        "label": "If Negative",
                        "expression": "state['sentiment'].strip().lower() == 'negative'",
                        "output": "negative",
                        "target": "llm_3"
                    },
                    {
                        "label": "If Neutral",
                        "expression": "state['sentiment'].strip().lower() == 'neutral'",
                        "output": "neutral",
                        "target": "llm_4"
                    }
                ],
                "defaultTarget": "llm_4"
            }
        },
        {
            "id": "e2-neutral",
            "source": "llm_1",
            "target": "llm_4",
            "type": "conditional",
            "label": "If Neutral / Default",
            "data": {
                "routes": [
                    {
                        "label": "If Positive",
                        "expression": "state['sentiment'].strip().lower() == 'positive'",
                        "output": "positive",
                        "target": "llm_2"
                    },
                    {
                        "label": "If Negative",
                        "expression": "state['sentiment'].strip().lower() == 'negative'",
                        "output": "negative",
                        "target": "llm_3"
                    },
                    {
                        "label": "If Neutral",
                        "expression": "state['sentiment'].strip().lower() == 'neutral'",
                        "output": "neutral",
                        "target": "llm_4"
                    }
                ],
                "defaultTarget": "llm_4"
            }
        },
        # Connect all response nodes to output
        {
            "id": "e3",
            "source": "llm_2",
            "target": "output_1",
            "type": "smoothstep"
        },
        {
            "id": "e4",
            "source": "llm_3",
            "target": "output_1",
            "type": "smoothstep"
        },
        {
            "id": "e5",
            "source": "llm_4",
            "target": "output_1",
            "type": "smoothstep"
        }
    ]
}

if __name__ == "__main__":
    # First, create the workflow
    print("Creating workflow...")
    create_response = requests.post(
        "http://localhost:8000/api/v1/workflows",
        json={
            "name": conditional_workflow["name"],
            "description": "Test conditional routing workflow",
            "graph_data": {
                "state_schema": conditional_workflow["state_schema"],
                "nodes": conditional_workflow["nodes"],
                "edges": conditional_workflow["edges"]
            }
        }
    )

    if create_response.status_code != 201:
        print(f"Failed to create workflow: {create_response.status_code}")
        print(create_response.text)
        exit(1)

    workflow_data = create_response.json()
    workflow_id = workflow_data["id"]
    print(f"✅ Workflow created with ID: {workflow_id}")

    # Now compile it
    print("\nCompiling workflow...")
    compile_response = requests.get(
        f"http://localhost:8000/api/v1/workflows/{workflow_id}/compile"
    )

    if compile_response.status_code != 200:
        print(f"Failed to compile workflow: {compile_response.status_code}")
        print(compile_response.text)
        exit(1)

    compile_data = compile_response.json()
    print("\n" + "="*80)
    print("GENERATED CODE:")
    print("="*80)
    print(compile_data["code"])
    print("="*80)

    # Save to file
    output_file = "/tmp/conditional_workflow_output.py"
    with open(output_file, "w") as f:
        f.write(compile_data["code"])

    print(f"\n✅ Code saved to: {output_file}")
