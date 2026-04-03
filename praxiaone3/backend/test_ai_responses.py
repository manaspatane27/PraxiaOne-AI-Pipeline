#!/usr/bin/env python3
print("=== TESTING AI RESPONSES WITH DUMMY DATA ===")
import requests

# Get token for demo_user
r = requests.post('http://127.0.0.1:8000/api/auth/token/', json={'username': 'demo_user', 'password': 'demo123'})
if r.status_code != 200:
    print('Failed to get token')
    exit()

token = r.json()['access']
headers = {'Authorization': f'Bearer {token}'}

# Test AI with different queries
queries = [
    'What is my current weight?',
    'What are my health goals?',
    'Tell me about my lab results'
]

print("Testing AI responses with dummy data:\n")

for query in queries:
    response = requests.post('http://127.0.0.1:8000/api/health-chat/',
                            json={'message': query},
                            headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f'Query: {query}')
        print(f'Data used: {data.get("data_used", [])}')
        print(f'Reply preview: {data.get("reply", "")[:100]}...')
        print('---')
    else:
        print(f'Query failed: {query}')