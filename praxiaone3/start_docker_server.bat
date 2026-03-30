pushd "%~dp0"
echo "--- PRAXIA ONE DOCKER SERVER STARTING (WINDOWS) ---"
docker-compose up --build -d
echo "--- ALL SERVICES RUNNING AT http://localhost:3000 ---"
echo "Attempting to pull DeepSeek model into Ollama container..."
docker exec -it praxiaone3-ollama-1 ollama run deepseek-r1:8b
pause
