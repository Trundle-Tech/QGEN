#!/usr/bin/env python3
"""
Simple Flask server to proxy Claude API requests
This avoids CORS issues when calling the API from the browser
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='.')
CORS(app)

CLAUDE_API_KEY = os.getenv('CLAUDE_API_KEY')
CLAUDE_API_ENDPOINT = 'https://api.anthropic.com/v1/messages'

# API routes must come before catch-all static route
@app.route('/api/generate', methods=['POST'])
def generate_quiz():
    """Proxy requests to Claude API"""

    if not CLAUDE_API_KEY or CLAUDE_API_KEY == 'your_api_key_here':
        return jsonify({'error': 'API key not configured'}), 500

    try:
        # Get request data from frontend
        data = request.json

        # Make request to Claude API
        headers = {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01'
        }

        response = requests.post(
            CLAUDE_API_ENDPOINT,
            headers=headers,
            json=data,
            timeout=60
        )

        # Return Claude's response
        if response.ok:
            return jsonify(response.json())
        else:
            error_msg = f'API Error: {response.text}'
            print(f'Claude API Error (Status {response.status_code}): {response.text}')
            return jsonify({
                'error': {'message': error_msg}
            }), response.status_code

    except Exception as e:
        print(f'Server Exception: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({'error': {'message': str(e)}}), 500

# Static file routes - must come after API routes
@app.route('/')
def index():
    """Serve the main HTML file"""
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files (CSS, JS, etc.)"""
    try:
        return app.send_static_file(path)
    except:
        return "File not found", 404

if __name__ == '__main__':
    if not CLAUDE_API_KEY or CLAUDE_API_KEY == 'your_api_key_here':
        print('ERROR: Please set your CLAUDE_API_KEY in the .env file')
        exit(1)

    print('Starting Quiz Generator Server...')
    print('Open http://localhost:5000 in your browser')
    app.run(host='0.0.0.0', port=5000, debug=True)
