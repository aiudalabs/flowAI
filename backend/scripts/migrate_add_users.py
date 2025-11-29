#!/usr/bin/env python3
"""
Database Migration Script: Add Users and Update Schema

This script:
1. Creates the users table
2. Adds user_id columns to workflows and executions tables
3. Creates a default system user
4. Assigns existing workflows to the system user

Usage:
    python scripts/migrate_add_users.py
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings  
from app.core.security import get_password_hash
from app.models.user import User
from app.models.workflow import Workflow
from app.models.execution import Execution


def run_migration():
    """Run the database migration"""
    
    print("🚀 Starting database migration: Add Users\n")
    print("=" * 70)
    
    # Create database connection
    engine = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Step 1: Create users table
        print("\n📊 Step 1: Creating users table...")
        from app.core.database import Base
        from app.models import user  # Import to register model
        Base.metadata.create_all(bind=engine, tables=[User.__table__])
        print("   ✅ Users table created")
        
        # Step 2: Check if user_id columns exist, if not add them
        print("\n📊 Step 2: Adding user_id columns...")
        
        with engine.connect() as conn:
            # Check and add user_id to workflows
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='workflows' AND column_name='user_id'
            """))
            
            if not result.fetchone():
                print("   Adding user_id to workflows table...")
                conn.execute(text("""
                    ALTER TABLE workflows 
                    ADD COLUMN user_id UUID REFERENCES users(id)
                """))
                conn.execute(text("""
                    CREATE INDEX idx_workflows_user_id ON workflows(user_id)
                """))
                conn.commit()
                print("   ✅ Added user_id to workflows")
            else:
                print("   ⏭️  user_id already exists in workflows")
            
            # Check and add user_id to executions
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='executions' AND column_name='user_id'
            """))
            
            if not result.fetchone():
                print("   Adding user_id to executions table...")
                conn.execute(text("""
                    ALTER TABLE executions 
                    ADD COLUMN user_id UUID REFERENCES users(id)
                """))
                conn.execute(text("""
                    CREATE INDEX idx_executions_user_id ON executions(user_id)
                """))
                conn.commit()
                print("   ✅ Added user_id to executions")
            else:
                print("   ⏭️  user_id already exists in executions")
        
        # Step 3: Create system user
        print("\n📊 Step 3: Creating system user...")
        
        system_user = session.query(User).filter(User.email == "system@flowai.local").first()
        
        if not system_user:
            system_user = User(
                email="system@flowai.local",
                username="system",
                full_name="System User",
                hashed_password=get_password_hash("system123!"),  # Change this!
                is_active=True,
                is_verified=True
            )
            session.add(system_user)
            session.commit()
            session.refresh(system_user)
            print(f"   ✅ System user created: {system_user.id}")
        else:
            print(f"   ⏭️  System user already exists: {system_user.id}")
        
        # Step 4: Assign orphaned workflows to system user
        print("\n📊 Step 4: Assigning workflows to system user...")
        
        orphaned_workflows = session.query(Workflow).filter(
            Workflow.user_id.is_(None)
        ).all()
        
        if orphaned_workflows:
            print(f"   Found {len(orphaned_workflows)} workflows without owner")
            for workflow in orphaned_workflows:
                workflow.user_id = system_user.id
                print(f"   ✅ Assigned workflow '{workflow.name}' to system user")
            
            session.commit()
            print(f"   ✅ Assigned {len(orphaned_workflows)} workflows")
        else:
            print("   ⏭️  No orphaned workflows found")
        
        # Step 5: Assign orphaned executions to system user
        print("\n📊 Step 5: Assigning executions to system user...")
        
        orphaned_executions = session.query(Execution).filter(
            Execution.user_id.is_(None)
        ).all()
        
        if orphaned_executions:
            print(f"   Found {len(orphaned_executions)} executions without owner")
            for execution in orphaned_executions:
                execution.user_id = system_user.id
            
            session.commit()
            print(f"   ✅ Assigned {len(orphaned_executions)} executions")
        else:
            print("   ⏭️  No orphaned executions found")
        
        # Summary
        print("\n" + "=" * 70)
        print("✅ Migration completed successfully!")
        print("=" * 70)
        print("\n📋 Summary:")
        print(f"   - Users table: Created")
        print(f"   - System user: {system_user.email}")
        print(f"   - Workflows migrated: {len(orphaned_workflows)}")
        print(f"   - Executions migrated: {len(orphaned_executions)}")
        print("\n💡 Next steps:")
        print("   1. Start the backend server")
        print("   2. Test registration: POST /api/v1/auth/register")
        print("   3. Test login: POST /api/v1/auth/login")
        print()
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    run_migration()
