from fhir.resources.observation import Observation
from fhir.resources.patient import Patient
from fhir.resources.condition import Condition


class FHIRR4Validator:

    @staticmethod
    def validate(resource_json):

        resource_type = resource_json.get("resourceType")

        if resource_type == "Observation":
            return Observation(**resource_json)

        if resource_type == "Patient":
            return Patient(**resource_json)

        if resource_type == "Condition":
            return Condition(**resource_json)

        raise ValueError(f"Unsupported FHIR R4 resource: {resource_type}")
