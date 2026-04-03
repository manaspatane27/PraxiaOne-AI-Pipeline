from django.contrib import admin
from .models import WeeklyGoal, WeightGoal, WeightEntry, UserProfile, UploadedDocument, Consent

admin.site.register(WeeklyGoal)
admin.site.register(WeightGoal)
admin.site.register(WeightEntry)
admin.site.register(UserProfile)
admin.site.register(UploadedDocument)
admin.site.register(Consent)
