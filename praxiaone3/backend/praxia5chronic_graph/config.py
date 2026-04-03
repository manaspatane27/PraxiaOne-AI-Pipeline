import os

# Neo4j Connection [cite: 263, 265]
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "Abc@123#$")

# Ollama / Med42 Configuration [cite: 267]
MED42_MODEL = "med42" # Or the model name you pulled in Ollama