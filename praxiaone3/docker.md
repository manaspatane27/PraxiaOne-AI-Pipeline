# 🐋 PraxiaOne: Professional Docker Guide

This document provides technical details for deploying the **PraxiaOne Health AI Pipeline** on a production server.

---

## 🚀 Rapid Deployment
To start the server immediately, use one of the automated scripts in the root folder:
- **Windows Server**: Run `start_docker_server.bat` (Run as Administrator)
- **Linux/Mac Server**: Run `bash start_docker_server.sh`

---

## 🏗️ The Infrastructure Stack
The `docker-compose.yml` file orchestrates 6 independent services:
1. **Frontend**: Next.js 15 UI (Port 3000)
2. **Backend**: Django 5.x RAG Engine (Port 8000)
3. **Database (MySQL)**: Persistent clinical data storage.
4. **Cache (Redis)**: Real-time messaging & task queuing.
5. **Vector DB (Qdrant)**: High-performance Medical PDF indexing.
6. **Ollama**: Local AI Inference for DeepSeek-R1.

---

## 🏎️ Hardware Acceleration (NVIDIA ONLY)
By default, the AI runs on the CPU for maximum compatibility. If your server contains an **Nvidia GPU** (8GB+ VRAM), do the following:

1. Open `docker-compose.yml`.
2. Find the `ollama:` service section (Line 32).
3. **Uncomment** the `deploy:` block at the bottom of that service.
4. Restart the server: `docker-compose up -d`.

---

## 🔐 Environment Sync
Ensure you create a `.env` file in the root directory before pushing if you want to use cloud cross-reference features (e.g., `GOOGLE_API_KEY`).

---
**Build Status**: `PROD-READY` | **RAG Version**: `v2.5 (Intersection-Scoring)`
