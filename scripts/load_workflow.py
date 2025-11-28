#!/usr/bin/env python3
"""
Script to load and optionally execute a workflow from a JSON file.

Usage:
    python scripts/load_workflow.py workflows/multi_perspective_analysis.json
    python scripts/load_workflow.py workflows/multi_perspective_analysis.json --execute --topic "AI-powered code review tools"
"""

import argparse
import json
import sys
import time
from pathlib import Path
import requests
from typing import Dict, Any

# API Configuration
API_BASE_URL = "http://localhost:8000/api/v1"


def load_workflow_file(filepath: str) -> Dict[str, Any]:
    """Load workflow from JSON file."""
    path = Path(filepath)
    if not path.exists():
        print(f"❌ Error: File not found: {filepath}")
        sys.exit(1)

    with open(path, 'r') as f:
        data = json.load(f)

    print(f"✅ Loaded workflow from: {filepath}")
    print(f"   Name: {data.get('name', 'Unnamed')}")
    print(f"   Description: {data.get('description', 'No description')}")

    graph_data = data.get('graph_data', {})
    num_nodes = len(graph_data.get('nodes', []))
    num_edges = len(graph_data.get('edges', []))
    print(f"   Nodes: {num_nodes}, Edges: {num_edges}")

    return data


def create_workflow(workflow_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create workflow via API."""
    url = f"{API_BASE_URL}/workflows"

    # Prepare payload
    payload = {
        "name": workflow_data.get("name", "Imported Workflow"),
        "description": workflow_data.get("description"),
        "graph_data": workflow_data.get("graph_data", {})
    }

    print(f"\n📤 Creating workflow via API...")

    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()

        workflow = response.json()
        print(f"✅ Workflow created successfully!")
        print(f"   ID: {workflow['id']}")
        print(f"   Name: {workflow['name']}")

        return workflow

    except requests.exceptions.RequestException as e:
        print(f"❌ Error creating workflow: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   Response: {e.response.text}")
        sys.exit(1)


def execute_workflow(workflow_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Execute workflow via API."""
    url = f"{API_BASE_URL}/executions"

    payload = {
        "workflow_id": workflow_id,
        "input_data": input_data
    }

    print(f"\n🚀 Executing workflow...")
    print(f"   Workflow ID: {workflow_id}")
    print(f"   Input data: {input_data}")

    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()

        execution = response.json()
        print(f"✅ Execution started!")
        print(f"   Execution ID: {execution['id']}")
        print(f"   Status: {execution['status']}")

        return execution

    except requests.exceptions.RequestException as e:
        print(f"❌ Error executing workflow: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   Response: {e.response.text}")
        sys.exit(1)


def check_execution_status(execution_id: str, max_wait: int = 300) -> Dict[str, Any]:
    """Poll execution status until completion."""
    url = f"{API_BASE_URL}/executions/{execution_id}"

    print(f"\n⏳ Waiting for execution to complete (max {max_wait}s)...")

    start_time = time.time()
    last_status = None

    while time.time() - start_time < max_wait:
        try:
            response = requests.get(url)
            response.raise_for_status()
            execution = response.json()

            status = execution['status']

            # Print status updates
            if status != last_status:
                print(f"   Status: {status}")
                last_status = status

            # Check if completed
            if status in ['completed', 'failed', 'cancelled']:
                print(f"\n{'✅' if status == 'completed' else '❌'} Execution {status}!")

                if status == 'completed' and execution.get('output_data'):
                    print("\n📊 Output Data:")
                    print(json.dumps(execution['output_data'], indent=2))
                elif execution.get('error_message'):
                    print(f"\n❌ Error: {execution['error_message']}")

                return execution

            time.sleep(2)

        except requests.exceptions.RequestException as e:
            print(f"❌ Error checking status: {e}")
            break

    print(f"\n⚠️ Timeout waiting for execution to complete")
    return {}


def main():
    parser = argparse.ArgumentParser(
        description="Load and optionally execute a workflow from JSON file"
    )
    parser.add_argument(
        "workflow_file",
        help="Path to workflow JSON file"
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Execute the workflow after loading"
    )
    parser.add_argument(
        "--topic",
        type=str,
        help="Topic to analyze (required if --execute is used)"
    )
    parser.add_argument(
        "--wait",
        action="store_true",
        help="Wait for execution to complete and show results"
    )

    args = parser.parse_args()

    # Load workflow from file
    workflow_data = load_workflow_file(args.workflow_file)

    # Create workflow in the system
    workflow = create_workflow(workflow_data)

    # Execute if requested
    if args.execute:
        if not args.topic:
            print("\n❌ Error: --topic is required when using --execute")
            sys.exit(1)

        input_data = {"topic": args.topic}
        execution = execute_workflow(workflow['id'], input_data)

        # Wait for completion if requested
        if args.wait:
            check_execution_status(execution['id'])

    print("\n" + "="*80)
    print("✅ Done!")
    print("="*80)
    print(f"\nWorkflow ID: {workflow['id']}")
    print(f"\nYou can now:")
    print(f"1. Open FlowAI UI: http://localhost:3000")
    print(f"2. Click 'Load' and select '{workflow['name']}'")
    print(f"3. Click 'Execute' and enter a topic to analyze")
    print(f"\nOr execute via API:")
    print(f"curl -X POST {API_BASE_URL}/executions \\")
    print(f"  -H 'Content-Type: application/json' \\")
    print(f"  -d '{{\"workflow_id\": \"{workflow['id']}\", \"input_data\": {{\"topic\": \"Your topic here\"}}}}'")


if __name__ == "__main__":
    main()
