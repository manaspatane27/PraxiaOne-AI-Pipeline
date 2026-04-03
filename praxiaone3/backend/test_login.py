import requests

try:
    r = requests.post("http://127.0.0.1:8000/api/auth/token/", json={"username": "manas", "password": "password"})
    print(r.status_code)
    print(r.text)
except Exception as e:
    print("Error:", e)
