from enum import Enum

class NodeType(str, Enum):
    PATIENT = "Patient"
    ENCOUNTER = "Encounter"
    DIAGNOSIS = "Diagnosis"
    SYMPTOM = "Symptom"
    MEDICATION = "Medication"
    RESEARCH_NODE = "ResearchNode"  # Connects Team 1
    DATASET_NODE = "DatasetNode"    # Connects Team 2

# Causal and temporal relationships defined by the PJKG methodology [cite: 231, 283]
RELATION_TYPES = [
    "HAS_ENCOUNTER",
    "HAS_DIAGNOSIS",
    "PROVEN_BY",   # Research Team Link
    "VALIDATED_BY", # Dataset Team Link
    "NEXT",         # Temporal Link
    "CAUSED_BY"     # Causal Link
]