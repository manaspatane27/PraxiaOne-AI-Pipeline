from rest_framework import serializers
from .models import (
    ChronicDisease,
    DiseaseMetric,
    MedicationPlan,
    CareGoal,
    RiskAssessment,
    AlertRule,
    DiseaseTimeline,
)


class DiseaseMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiseaseMetric
        fields = ['id', 'metric_type', 'value', 'unit', 'reference_min', 'reference_max', 'measured_at']


class MedicationPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicationPlan
        fields = [
            'id', 'medication_name', 'generic_name', 'dosage', 'frequency',
            'status', 'adherence_percentage', 'side_effects', 'notes',
            'started_date', 'ended_date'
        ]


class CareGoalSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = CareGoal
        fields = [
            'id', 'goal_title', 'goal_description', 'target_value', 'current_value',
            'unit', 'status', 'target_date', 'progress_percentage'
        ]

    def get_progress_percentage(self, obj):
        if obj.target_value == 0:
            return 0
        return (obj.current_value / obj.target_value) * 100


class RiskAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiskAssessment
        fields = [
            'id', 'risk_level', 'risk_score', 'contributing_factors',
            'recommendations', 'confidence_score', 'assessment_date', 'follow_up_date'
        ]


class AlertRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertRule
        fields = [
            'id', 'alert_type', 'metric_type', 'threshold_min', 'threshold_max',
            'is_active', 'notify_user', 'notify_doctor', 'severity'
        ]


class DiseaseTimelineSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiseaseTimeline
        fields = ['id', 'event_type', 'event_title', 'event_description', 'event_date', 'impact_level']


class ChronicDiseaseDetailSerializer(serializers.ModelSerializer):
    metrics = DiseaseMetricSerializer(many=True, read_only=True)
    medications = MedicationPlanSerializer(many=True, read_only=True)
    care_goals = CareGoalSerializer(many=True, read_only=True)
    risk_assessments = RiskAssessmentSerializer(many=True, read_only=True)
    alert_rules = AlertRuleSerializer(many=True, read_only=True)
    timeline_events = DiseaseTimelineSerializer(many=True, read_only=True)

    class Meta:
        model = ChronicDisease
        fields = [
            'id', 'disease_type', 'disease_name', 'diagnosis_date', 'severity',
            'is_active', 'risk_score', 'notes', 'metrics', 'medications',
            'care_goals', 'risk_assessments', 'alert_rules', 'timeline_events'
        ]


class ChronicDiseaseListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChronicDisease
        fields = ['id', 'disease_type', 'disease_name', 'severity', 'risk_score', 'is_active']
