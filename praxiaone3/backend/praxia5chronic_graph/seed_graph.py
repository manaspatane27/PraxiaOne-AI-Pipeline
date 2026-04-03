from knowledge_bridge import KnowledgeBridge

def run_seed():
    print("🚀 Connecting Team Research (Mitigation) and Team Datasets...")
    try:
        bridge = KnowledgeBridge()
        
        # 1. Diabetes Connection
        bridge.link_research_to_data(
            "Diabetes", 
            "https://arxiv.org/pdf/2301.10450", 
            "Pima Indians Dataset"
        )
        
        # 2. Hypertension Connection
        bridge.link_research_to_data(
            "Hypertension", 
            "https://www.sciencedirect.com/science/article/pii/S153204642030112X", 
            "NHANES Blood Pressure"
        )
        
        # 3. Obesity Connection
        bridge.link_research_to_data(
            "Obesity", 
            "https://www.sciencedirect.com/science/article/pii/S2352340919306985", 
            "UCI Obesity Levels"
        )
        
        print("✅ SUCCESS: Teams successfully connected in the Knowledge Graph!")
        
    except Exception as e:
        print(f"❌ ERROR: Could not connect teams. Check if Neo4j is running. \nDetail: {e}")

if __name__ == "__main__":
    run_seed()