# 🩺 PraxiaOne: Parallel Health AI Pipeline & Medical Dashboard

Welcome to the **PraxiaOne team deployment guide**. This platform is a high-performance, multi-model Medical AI Assistant designed to cross-reference clinical data across three independent AI engines simultaneously.

---

## ⚡ Quick Start: 3-Step Setup (Recommended)
This uses **Docker** to handle all databases, backend APIs, and the frontend portal automatically.

### 1️⃣ Download Required Tools
Your machine needs these 3 tools installed to run the full stack:
- **[Download Docker Desktop](https://www.docker.com/products/docker-desktop/)** (Core Engine)
- **[Download Ollama](https://ollama.com/)** (Local LLM Runner)
- **[Open your Terminal]** (PowerShell or Bash)

### 2️⃣ Initialize the Platform
Open your terminal in the root `praxiaone3` folder and run:
```bash
# 1. Start all secure databases & application containers
docker-compose up --build -d

# 2. Inject the DeepSeek Medical Brain into the system
docker exec -it praxiaone3-ollama-1 ollama run deepseek-r1:8b
```

### 3️⃣ Start Diagnosing!
- **🌐 Web Interface**: [http://localhost:3000](http://localhost:3000)
- **⚙️ Backend API**: [http://localhost:8000](http://localhost:8000)
- **🧠 First Step**: Go to the **Sign Up** page, create a username (no spaces), and set your **Consent** settings to unlock the AI!

---

## 🛠️ Developer Setup (Manual Mode)
If you need to edit the code and watch it update in real-time, use this method.

### 🟩 Prerequisites
- **[Python 3.10+](https://www.python.org/downloads/)**
- **[Node.js v18+](https://nodejs.org/)**

### Step A: Backend (Django API)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate       # On Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Step B: Frontend (Next.js UI)
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

---

## 🔐 Privacy & Multi-User Isolation
PraxiaOne is built for clinical data security:
- **Zero-Bleeed Privacy**: No user can see another doctor's chat logs or documents.
- **Mandatory Consent**: Every new user is automatically routed to the **Consent Dashboard** right after signup to set their data-sharing limits.
- **Mock Social Logins**: For demo purposes, use the **"Continue with Google"** button to instantly generate a secure, isolated mock account.

---

## 🧬 Why the Triple Parallel Pipeline?
Because single-model AI can hallucinate, we run every query through **three** independent voices:
1. **DeepSeek-R1 (8B)**: Reasoning expert, hosted locally.
2. **Med42 (Llama-3)**: Healthcare-specific fine-tuned model.
3. **Google Gemini 2.5 Flash**: Cloud-based verification layers.

## ⚠️ Important for Deployment
- **API Keys**: Add your `GOOGLE_API_KEY` to the `backend/.env` file to enable the cloud cross-reference layer.
- **VRAM**: This system is optimized for GPUs with 8GB-12GB VRAM. If it's slow, close other apps like Chrome or Photoshop to free up memory for the Local LLM.

---
**Build Status**: `PROD-READY` | **RAG Version**: `v2.5 (Intersection-Scoring)`

