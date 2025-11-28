#!/usr/bin/env python3
"""
Setup script for FlowAI backend
Generates .env file with secure SECRET_KEY
"""

import secrets
import os

def generate_secret_key(length=64):
    """Generate a secure random secret key"""
    return secrets.token_urlsafe(length)

def create_env_file():
    """Create .env file from .env.example with generated SECRET_KEY"""

    # Check if .env already exists
    if os.path.exists('.env'):
        response = input('.env file already exists. Overwrite? (y/N): ')
        if response.lower() != 'y':
            print('Setup cancelled.')
            return

    # Read .env.example
    if not os.path.exists('.env.example'):
        print('Error: .env.example not found')
        return

    with open('.env.example', 'r') as f:
        content = f.read()

    # Generate secret key
    secret_key = generate_secret_key()

    # Replace placeholder
    content = content.replace(
        'SECRET_KEY=your-secret-key-here-change-in-production',
        f'SECRET_KEY={secret_key}'
    )

    # Write .env
    with open('.env', 'w') as f:
        f.write(content)

    print('✅ .env file created successfully!')
    print('\n⚠️  Important: Add your API keys to .env:')
    print('   - OPENAI_API_KEY')
    print('   - ANTHROPIC_API_KEY')
    print('   - GOOGLE_API_KEY')
    print('\n📝 Edit .env file to add your keys before running the app.')

if __name__ == '__main__':
    print('FlowAI Backend Setup')
    print('=' * 50)
    create_env_file()
