from neo4j import GraphDatabase
from config import NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD

class GraphBuilder:
    def __init__(self):
        self.driver = GraphDatabase.driver(
            NEO4J_URI, 
            auth=(NEO4J_USER, NEO4J_PASSWORD)
        )

    def close(self):
        self.driver.close()

    def create_patient_node(self, patient_id, name, age):
        """Creates the base Patient Profile Node [cite: 226]"""
        query = "MERGE (p:Patient {id: $id}) SET p.name = $name, p.age = $age"
        with self.driver.session() as session:
            session.run(query, id=patient_id, name=name, age=age)

    def ingest_encounter(self, patient_id, encounter_id, data):
        """Implements the PJKG formula: linking encounters to entities [cite: 354, 357]"""
        with self.driver.session() as session:
            # 1. Create Encounter Node and link to Patient [cite: 227, 378]
            session.run("""
                MATCH (p:Patient {id: $pid})
                MERGE (e:Encounter {id: $eid})
                SET e.date = $date
                MERGE (p)-[:HAS_ENCOUNTER]->(e)
            """, pid=patient_id, eid=encounter_id, date=data.get('date'))

            # 2. Extract and link Diagnosis (Team Datasets) [cite: 386, 390]
            for diag in data.get("Diagnosis", []):
                session.run("""
                    MATCH (e:Encounter {id: $eid})
                    MERGE (d:Diagnosis {name: $name})
                    SET d.icd10 = $icd
                    MERGE (e)-[:HAS_DIAGNOSIS]->(d)
                """, eid=encounter_id, name=diag['name'], icd=diag.get('icd10'))

            # 3. Add Causal Linking (Research Team logic) [cite: 231, 325]
            if "caused_by" in data:
                session.run("""
                    MATCH (d1:Diagnosis {name: $diag}), (d2:Diagnosis {name: $cause})
                    MERGE (d1)-[:CAUSED_BY]->(d2)
                """, diag=data['diagnosis'], cause=data['caused_by'])