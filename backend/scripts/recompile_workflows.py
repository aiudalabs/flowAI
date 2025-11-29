#!/usr/bin/env python3
"""
Recompile All Workflows Script

This script recompiles all existing workflows in the database with the latest
compiler code. This is useful after making changes to the LangGraphCompiler
to apply those changes to already-saved workflows.

Usage:
    python scripts/recompile_workflows.py
"""

import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.workflow import Workflow
from app.services.compiler.langgraph_compiler import LangGraphCompiler


def recompile_all_workflows():
    """Recompile all workflows in the database"""
    
    # Create database connection
    engine = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Get all workflows
        workflows = session.query(Workflow).all()
        
        if not workflows:
            print("📭 No workflows found in database")
            return
        
        print(f"📊 Found {len(workflows)} workflows to recompile")
        print("=" * 60)
        
        # Create compiler instance
        compiler = LangGraphCompiler()
        
        # Recompile each workflow
        success_count = 0
        error_count = 0
        
        for workflow in workflows:
            try:
                print(f"\n🔧 Recompiling: {workflow.name}")
                print(f"   ID: {workflow.id}")
                
                # Extract graph data
                graph_data = workflow.graph_data
                workflow_name = workflow.name
                state_schema = graph_data.get("state_schema", [])
                nodes = graph_data.get("nodes", [])
                edges = graph_data.get("edges", [])
                
                print(f"   Nodes: {len(nodes)}, Edges: {len(edges)}")
                
                # Compile with latest compiler
                compiled_code = compiler.compile({
                    "name": workflow_name,
                    "state_schema": state_schema,
                    "nodes": nodes,
                    "edges": edges
                })
                
                # Update in database
                workflow.compiled_code = compiled_code
                session.commit()
                
                print(f"   ✅ Successfully recompiled")
                success_count += 1
                
            except Exception as e:
                print(f"   ❌ Error: {str(e)}")
                error_count += 1
                session.rollback()
        
        # Summary
        print("\n" + "=" * 60)
        print("📈 RECOMPILATION SUMMARY")
        print("=" * 60)
        print(f"✅ Successful: {success_count}")
        print(f"❌ Errors: {error_count}")
        print(f"📊 Total: {len(workflows)}")
        
        if error_count == 0:
            print("\n🎉 All workflows recompiled successfully!")
        else:
            print(f"\n⚠️  {error_count} workflows failed to recompile")
        
    finally:
        session.close()


if __name__ == "__main__":
    print("🚀 Starting workflow recompilation...")
    print()
    recompile_all_workflows()
