from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    WeeklyGoal,
    WeightGoal,
    WeightEntry,
    UserProfile,
    UploadedDocument,
    Consent,
    ChatMessage,
)


class WeeklyGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeeklyGoal
        fields = "__all__"
        read_only_fields = ["id", "user", "created_at"]


class WeightGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightGoal
        fields = "__all__"
        read_only_fields = ["id", "user", "created_at"]


class WeightEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightEntry
        fields = "__all__"
        read_only_fields = ["id", "user", "created_at"]


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = "__all__"
        read_only_fields = ["id", "user", "updated_at"]


class UploadedDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedDocument
        fields = "__all__"
        read_only_fields = ["id", "user", "uploaded_at"]


class ConsentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consent
        fields = "__all__"
        read_only_fields = ["id", "user", "updated_at"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def validate_username(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Username is required.")
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def create(self, validated_data):
        username = validated_data.get("username")
        email = validated_data.get("email", "")
        password = validated_data.get("password")
        user = User(username=username, email=email)
        user.set_password(password)
        user.save()
        return user

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ["id", "role", "text", "created_at"]
