from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class ChronicDisease(models.Model):
    """Top 10 US Chronic Diseases"""
    DISEASE_CHOICES = [
        ('type2_diabetes', 'Type 2 Diabetes'),
        ('hypertension', 'Hypertension (High Blood Pressure)'),
        ('coronary_artery_disease', 'Coronary Artery Disease'),
        ('copd', 'COPD (Chronic Obstructive Pulmonary Disease)'),
        ('asthma', 'Asthma'),
        ('chronic_kidney_disease', 'Chronic Kidney Disease'),
        ('heart_failure', 'Heart Failure'),
        ('arthritis', 'Arthritis'),
        ('depression', 'Depression'),
        ('obesity', 'Obesity'),
    ]

    SEVERITY_CHOICES = [
        ('mild', 'Mild'),
        ('moderate', 'Moderate'),
        ('severe', 'Severe'),
        ('critical', 'Critical'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chronic_diseases'
    )
    disease_type = models.CharField(max_length=50, choices=DISEASE_CHOICES)
    disease_name = models.CharField(max_length=255)
    
    # Clinical Information
    diagnosis_date = models.DateField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='moderate')
    is_active = models.BooleanField(default=True)
    
    # Disease-Specific Notes
    notes = models.TextField(blank=True)
    clinical_notes = models.JSONField(default=dict, blank=True)
    
    # Risk & AI Metrics
    risk_score = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )
    last_risk_assessment = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'disease_type']),
            models.Index(fields=['user', 'is_active']),
        ]
        unique_together = ('user', 'disease_type')

    def __str__(self):
        return f"{self.user} - {self.get_disease_type_display()}"


class DiseaseMetric(models.Model):
    """Track disease-specific metrics"""
    METRIC_TYPES = {
        'type2_diabetes': [
            'hba1c',
            'fasting_glucose',
            'blood_glucose',
            'triglycerides',
        ],
        'hypertension': [
            'systolic_bp',
            'diastolic_bp',
            'mean_arterial_pressure',
        ],
        'coronary_artery_disease': [
            'troponin',
            'ldl_cholesterol',
            'hdl_cholesterol',
            'ejection_fraction',
        ],
        'copd': [
            'fev1',
            'fev1_fvc_ratio',
            'oxygen_saturation',
        ],
        'asthma': [
            'peak_flow',
            'fev1',
            'oxygen_saturation',
        ],
        'chronic_kidney_disease': [
            'creatinine',
            'gfr',
            'urine_protein',
            'potassium',
        ],
        'heart_failure': [
            'ejection_fraction',
            'bnp',
            'systolic_bp',
            'diastolic_bp',
        ],
        'arthritis': [
            'pain_level',
            'inflammation_markers',
            'mobility_score',
        ],
        'depression': [
            'mood_score',
            'sleep_quality',
            'activity_level',
        ],
        'obesity': [
            'bmi',
            'waist_circumference',
            'body_fat_percentage',
        ],
    }

    disease = models.ForeignKey(
        ChronicDisease,
        on_delete=models.CASCADE,
        related_name='metrics'
    )
    metric_type = models.CharField(max_length=100)
    value = models.FloatField()
    unit = models.CharField(max_length=50)
    
    # Reference ranges for comparison
    reference_min = models.FloatField(null=True, blank=True)
    reference_max = models.FloatField(null=True, blank=True)
    
    # when the metric was taken; default to now if not provided so tests
    # can create metrics without specifying it explicitly.
    measured_at = models.DateTimeField(default=timezone.now)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-measured_at']
        indexes = [
            models.Index(fields=['disease', 'metric_type', 'measured_at']),
        ]

    def __str__(self):
        return f"{self.disease} - {self.metric_type}: {self.value} {self.unit}"


class MedicationPlan(models.Model):
    """Medication management for chronic diseases"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('discontinued', 'Discontinued'),
    ]

    disease = models.ForeignKey(
        ChronicDisease,
        on_delete=models.CASCADE,
        related_name='medications'
    )
    medication_name = models.CharField(max_length=255)
    generic_name = models.CharField(max_length=255, blank=True)
    dosage = models.CharField(max_length=100)  # e.g., "500mg"
    frequency = models.CharField(max_length=100)  # e.g., "Twice daily"
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Adherence tracking
    adherence_percentage = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )
    
    # Side effects and notes
    side_effects = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    # medication start date; make optional/default today for tests
    started_date = models.DateField(default=timezone.now)
    ended_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.disease.user} - {self.medication_name}"


class CareGoal(models.Model):
    """Track health goals for chronic disease management"""
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('achieved', 'Achieved'),
        ('failed', 'Failed'),
    ]

    disease = models.ForeignKey(
        ChronicDisease,
        on_delete=models.CASCADE,
        related_name='care_goals'
    )
    goal_title = models.CharField(max_length=255)
    goal_description = models.TextField()
    
    # Goal metrics
    target_value = models.FloatField()
    current_value = models.FloatField(default=0.0)
    unit = models.CharField(max_length=50)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    
    # Timeline
    # target_date may be omitted in tests; default to now
    target_date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.disease.user} - {self.goal_title}"

    @property
    def progress_percentage(self):
        """Compute progress as a percentage of target value.

        This is not persisted to the database; tasks may cache the
        value by assigning to the instance at runtime if desired.
        """
        if self.target_value == 0:
            return 0.0
        return (self.current_value / self.target_value) * 100


class RiskAssessment(models.Model):
    """AI-generated risk assessments for disease progression"""
    RISK_LEVELS = [
        ('low', 'Low Risk'),
        ('moderate', 'Moderate Risk'),
        ('high', 'High Risk'),
        ('critical', 'Critical Risk'),
    ]

    disease = models.ForeignKey(
        ChronicDisease,
        on_delete=models.CASCADE,
        related_name='risk_assessments'
    )
    
    risk_level = models.CharField(max_length=20, choices=RISK_LEVELS)
    risk_score = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(100.0)])
    
    # AI Generated Insights
    contributing_factors = models.JSONField(default=list)  # List of risk factors
    recommendations = models.JSONField(default=list)  # AI-proposed actions
    confidence_score = models.FloatField(default=0.0)
    
    # Grounding & Evidence
    grounding_evidence = models.TextField(blank=True)  # Evidence from patient data
    sources = models.JSONField(default=list)  # Data sources used
    
    assessment_date = models.DateTimeField(auto_now_add=True)
    # follow_up_date is optional; some records may not include it. Tests create
    # assessments without specifying this field so allow null/blank.
    follow_up_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['-assessment_date']

    def __str__(self):
        return f"{self.disease.user} - {self.disease.disease_name} - {self.risk_level}"


class AlertRule(models.Model):
    """Custom alert rules for disease monitoring"""
    ALERT_TYPES = [
        ('threshold', 'Threshold Exceeded'),
        ('trend', 'Trend Alert'),
        ('medication', 'Medication Reminder'),
        ('appointment', 'Appointment Reminder'),
    ]

    disease = models.ForeignKey(
        ChronicDisease,
        on_delete=models.CASCADE,
        related_name='alert_rules'
    )
    
    alert_type = models.CharField(max_length=50, choices=ALERT_TYPES)
    metric_type = models.CharField(max_length=100)  # e.g., 'blood_glucose'
    
    # Threshold configuration
    threshold_min = models.FloatField(null=True, blank=True)
    threshold_max = models.FloatField(null=True, blank=True)
    
    # Notification settings
    is_active = models.BooleanField(default=True)
    notify_user = models.BooleanField(default=True)
    notify_doctor = models.BooleanField(default=False)
    
    severity = models.CharField(
        max_length=20,
        choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')],
        default='medium'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.disease.user} - {self.get_alert_type_display()}"


class DiseaseTimeline(models.Model):
    """Timeline of significant events in disease progression"""
    REASON_CHOICES = [
        ('diagnosis', 'Diagnosis'),
        ('hospitalization', 'Hospitalization'),
        ('medication_change', 'Medication Change'),
        ('procedure', 'Medical Procedure'),
        ('milestone', 'Major Milestone'),
        ('complication', 'Complication'),
        ('remission', 'Remission'),
        ('other', 'Other'),
    ]

    disease = models.ForeignKey(
        ChronicDisease,
        on_delete=models.CASCADE,
        related_name='timeline_events'
    )
    
    event_type = models.CharField(max_length=50, choices=REASON_CHOICES)
    event_title = models.CharField(max_length=255)
    event_description = models.TextField()
    
    event_date = models.DateField()
    impact_level = models.CharField(
        max_length=50,
        choices=[('positive', 'Positive'), ('neutral', 'Neutral'), ('negative', 'Negative')],
        default='neutral'
    )
    
    attachments = models.JSONField(default=list, blank=True)  # File references
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-event_date']

    def __str__(self):
        return f"{self.disease.user} - {self.event_title}"
