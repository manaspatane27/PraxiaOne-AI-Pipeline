import urllib.request
import json

# Read API key from .env
key = ""
with open(".env", "r") as f:
    for line in f:
        if line.startswith("GOOGLE_API_KEY="):
            key = line.strip().split("=", 1)[1]

# API endpoint
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}"

# Request data (THIS is what you were missing)
data = {
    "contents": [
        {
            "parts": [
                {"text": "Explain sciatica in simple terms"}
            ]
        }
    ]
}

# Convert to JSON
json_data = json.dumps(data).encode("utf-8")

# Create request
req = urllib.request.Request(
    url,
    data=json_data,
    headers={"Content-Type": "application/json"}
)

# Send request
try:
    res = urllib.request.urlopen(req)
    result = json.loads(res.read())

    print(result["candidates"][0]["content"]["parts"][0]["text"])

except Exception as e:
    print(f"Error: {e}")