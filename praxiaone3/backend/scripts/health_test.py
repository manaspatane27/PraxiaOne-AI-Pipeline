import requests, os
BASE='http://localhost:8000'
# login
data={'username':'demo_user','password':'demo123'}
r=requests.post(f'{BASE}/api/auth/token/', data=data)
print('login', r.status_code, r.text)
access=r.json().get('access')
headers={'Authorization':f'Bearer {access}'}
# send health message
payload={'message':'Analyze the discharge summary and identify key biomarkers from the attached document. [Attached File: mediclaim.pdf]'}
# backend route is 'health-chat' (not 'health')
r2=requests.post(f'{BASE}/api/health-chat/', json=payload, headers=headers)
print('health', r2.status_code)
print(r2.text)
