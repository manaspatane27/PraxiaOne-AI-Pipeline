import os
import requests
base = 'http://localhost:8000'
# login
data = {'username':'demo_user','password':'demo123'}
r = requests.post(f'{base}/api/auth/token/', data=data)
print('login', r.status_code, r.text)
access = r.json().get('access')
headers = {'Authorization': f'Bearer {access}'}
file_path = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', 'mediclaim.pdf'))
with open(file_path, 'rb') as f:
    files = {'file': f}
    extra = {'doc_type': 'care_plan', 'title': 'test upload'}
    u = requests.post(f'{base}/api/documents/', headers=headers, files=files, data=extra)
    print('upload', u.status_code, u.text)
