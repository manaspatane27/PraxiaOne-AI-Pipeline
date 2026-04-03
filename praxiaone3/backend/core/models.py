from django.db import models
from django.conf import settings


class WeeklyGoal(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    goal = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.goal}"


class WeightGoal(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    target_weight = models.DecimalField(max_digits=5, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} target {self.target_weight}kg"


class WeightEntry(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    current_weight = models.DecimalField(max_digits=5, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} current {self.current_weight}kg"


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    full_name = models.CharField(max_length=120, blank=True, default="")
    age = models.PositiveIntegerField(null=True, blank=True)
    height_cm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    wellness_interests = models.JSONField(default=list, blank=True)

    diet_preference = models.CharField(max_length=30, blank=True, default="")
    notes = models.TextField(blank=True, default="")

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user} profile"


class UploadedDocument(models.Model):
    DOC_TYPES = (
        ("care_plan", "Care Plan"),
        ("lab_result", "Lab Result"),
        ("insurance_policy", "Insurance Policy"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    doc_type = models.CharField(max_length=20, choices=DOC_TYPES)
    file = models.FileField(upload_to="uploads/%Y/%m/")
    title = models.CharField(max_length=255, blank=True, default="")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # --- ADD THESE NEW FIELDS ---
    processing_status = models.CharField(
        max_length=20, # <--- Fixed to max_length
        default="pending", 
        choices=(("pending", "Pending"), ("completed", "Completed"), ("failed", "Failed"))
    )
    raw_text_extracted = models.TextField(blank=True, default="")
    # ----------------------------

    def __str__(self):
        return f"{self.user} - {self.doc_type} - {self.title or self.file.name}"


class Consent(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="consent",
    )

    care_plan_allowed = models.BooleanField(default=False)
    lab_results_allowed = models.BooleanField(default=False)

    vitals_allowed = models.BooleanField(default=False)
    ai_insights_allowed = models.BooleanField(default=False)
    recommendations_allowed = models.BooleanField(default=False)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user} consent"


class ChatMessage(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_messages",
    )
    role = models.CharField(max_length=10, choices=(("user", "user"), ("ai", "ai")))
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} {self.role} @ {self.created_at}"


class VitalsEntry(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="vitals"
    )
    # Clinical metrics requested by user
    oxygen_level = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True) # SpO2 %
    pulse_rate = models.IntegerField(null=True, blank=True) # BPM
    sugar_level = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True) # mg/dL
    bp_systolic = models.IntegerField(null=True, blank=True)
    bp_diastolic = models.IntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} Vitals @ {self.created_at}"
