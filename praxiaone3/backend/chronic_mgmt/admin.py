from django.contrib import admin
from .models import (
    ChronicDisease,
    DiseaseMetric,
    MedicationPlan,
    CareGoal,
    RiskAssessment,
    AlertRule,
    DiseaseTimeline,
)


@admin.register(ChronicDisease)
class ChronicDiseaseAdmin(admin.ModelAdmin):
    list_display = ['user', 'disease_name', 'severity', 'risk_score', 'is_active', 'diagnosis_date']
    list_filter = ['disease_type', 'severity', 'is_active', 'created_at']
    search_fields = ['user__username', 'disease_name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Patient & Disease Info', {
            'fields': ('user', 'disease_type', 'disease_name', 'diagnosis_date')
        }),
        ('Clinical Status', {
            'fields': ('severity', 'is_active', 'risk_score', 'last_risk_assessment')
        }),
        ('Notes', {
            'fields': ('notes', 'clinical_notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(DiseaseMetric)
class DiseaseMetricAdmin(admin.ModelAdmin):
    list_display = ['disease', 'metric_type', 'value', 'unit', 'measured_at']
    list_filter = ['metric_type', 'measured_at', 'disease__disease_type']
    search_fields = ['disease__user__username', 'metric_type']


@admin.register(MedicationPlan)
class MedicationPlanAdmin(admin.ModelAdmin):
    list_display = ['disease', 'medication_name', 'dosage', 'status', 'adherence_percentage']
    list_filter = ['status', 'started_date']
    search_fields = ['medication_name', 'disease__user__username']


@admin.register(CareGoal)
class CareGoalAdmin(admin.ModelAdmin):
    list_display = ['disease', 'goal_title', 'status', 'target_date']
    list_filter = ['status', 'target_date']
    search_fields = ['goal_title', 'disease__user__username']


@admin.register(RiskAssessment)
class RiskAssessmentAdmin(admin.ModelAdmin):
    list_display = ['disease', 'risk_level', 'risk_score', 'assessment_date']
    list_filter = ['risk_level', 'assessment_date']
    search_fields = ['disease__user__username']
    readonly_fields = ['assessment_date']


@admin.register(AlertRule)
class AlertRuleAdmin(admin.ModelAdmin):
    list_display = ['disease', 'alert_type', 'metric_type', 'severity', 'is_active']
    list_filter = ['alert_type', 'severity', 'is_active']
    search_fields = ['disease__user__username', 'metric_type']


@admin.register(DiseaseTimeline)
class DiseaseTimelineAdmin(admin.ModelAdmin):
    list_display = ['disease', 'event_type', 'event_title', 'event_date', 'impact_level']
    list_filter = ['event_type', 'event_date', 'impact_level']
    search_fields = ['event_title', 'disease__user__username']
