from graph_builder import GraphBuilder

class KnowledgeBridge:
    def __init__(self):
        # Connects to your Neo4j database via the GraphBuilder worker
        self.db = GraphBuilder()

    def link_research_to_data(self, diagnosis_name, research_url, dataset_name):
        """
        Triangle of Trust: Links a Diagnosis to a Research Paper and a Dataset Source.
        """
        query = """
        MERGE (d:Diagnosis {name: $diag})
        MERGE (r:ResearchNode {url: $url, type: 'Paper'})
        MERGE (ds:DatasetNode {name: $ds_name, type: 'Dataset Source'})
        MERGE (d)-[:PROVEN_BY]->(r)
        MERGE (r)-[:VALIDATED_BY]->(ds)
        """
        with self.db.driver.session() as session:
            session.run(query, diag=diagnosis_name, url=research_url, ds_name=dataset_name)