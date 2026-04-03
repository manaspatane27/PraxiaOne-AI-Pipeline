import requests
from config import MED42_MODEL, NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD
from neo4j import GraphDatabase

def get_graph_context(diagnosis_name):
    """Fetches the team-linked sources from Neo4j"""
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    query = """
    MATCH (d:Diagnosis {name: $name})-[:PROVEN_BY]->(r:ResearchNode)
    MATCH (r)-[:VALIDATED_BY]->(ds:DatasetNode)
    RETURN r.url as paper, ds.name as dataset
    """
    with driver.session() as session:
        result = session.run(query, name=diagnosis_name)
        record = result.single()
        return record if record else None

def reason_with_sources(query, diagnosis):
    context = get_graph_context(diagnosis)
    
    # 1. Define the Specialist Persona
    system_instruction = """
    You are a Senior Clinical Specialist at PraxiaOne. 
    Your goal is to provide high-precision medical insights for chronic disease management.
    
    RULES:
    - Step-by-Step Reasoning: Analyze the patient's vitals trends before reaching a conclusion.
    - Evidence-Based: You MUST cite the provided Research Paper URL and Dataset Name.
    - Tone: Empathetic yet data-driven.
    - Constraint: If the graph context is missing, advise the patient to sync their wearable device.
    """

    if context:
        graph_data = f"CLINICAL EVIDENCE:\n- Research: {context['paper']}\n- Data Source: {context['dataset']}"
    else:
        graph_data = "No specific graph context found for this diagnosis."

    # 2. Enhanced Prompt Structure
    full_prompt = f"{system_instruction}\n\n{graph_data}\n\nPatient Query: {query}\n\nClinical Insight:"
    
    response = requests.post("http://localhost:11434/api/generate", 
                             json={
                                 "model": "med42", 
                                 "prompt": full_prompt, 
                                 "stream": False,
                                 "options": {"temperature": 0.2} # Keep it factual, not creative
                             })
    
    return response.json()['response']