#!/usr/bin/env python3
"""
Seed script to populate the PraxiaOne database with sample data for AI testing.
Run this after migrations and with the server running.
"""

import os
import sys
import django
from datetime import datetime, timedelta
import random

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'praxiaone.settings')

django.setup()

from django.contrib.auth.models import User
from core.models import UserProfile, WeightEntry, WeeklyGoal, WeightGoal, UploadedDocument
from praxia_ai.qdrant_client import get_client

def create_sample_user():
    """Create a sample user if not exists."""
    user, created = User.objects.get_or_create(
        username='demo_user',
        defaults={
            'email': 'demo@example.com',
            'first_name': 'Demo',
            'last_name': 'User'
        }
    )
    if created:
        user.set_password('demo123')
        user.save()
        print("Created demo user: demo_user / demo123")
    else:
        print("Demo user already exists")

    # Create or get profile
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'full_name': 'Demo User',
            'age': 38,
            'height_cm': 175.0,
            'weight_kg': 80.0,
            'wellness_interests': ['Weight Management', 'Diabetes Control', 'Cardiovascular Health'],
            'diet_preference': 'Low Carb',
            'notes': 'Patient with Type 2 Diabetes and Hypertension. Managing with medication and lifestyle changes.',
        }
    )

    # Set consent to allow all data for demo
    from core.models import Consent
    consent, _ = Consent.objects.get_or_create(
        user=user,
        defaults={
            'care_plan_allowed': True,
            'lab_results_allowed': True,
            'vitals_allowed': True,
            'ai_insights_allowed': True,
            'recommendations_allowed': True,
        }
    )
    if not consent.care_plan_allowed:
        consent.care_plan_allowed = True
        consent.lab_results_allowed = True
        consent.vitals_allowed = True
        consent.ai_insights_allowed = True
        consent.recommendations_allowed = True
        consent.save()
        print("Enabled all consents for demo user")

    return user, profile

def create_weight_entries(user):
    """Create sample weight entries over the past 30 days."""
    entries = []
    base_weight = 82.0
    for i in range(30):
        # Create entries with different created_at times
        created_at = datetime.now() - timedelta(days=i)
        weight = base_weight + random.uniform(-2, 2)  # Slight variation
        entry = WeightEntry.objects.create(
            user=user,
            current_weight=round(weight, 1),
        )
        # Manually set created_at to simulate past dates
        entry.created_at = created_at
        entry.save()
        entries.append(entry)
    print(f"Created {len(entries)} weight entries")
    return entries

def create_goals(user):
    """Create sample goals."""
    # Weekly goal
    weekly_goal, _ = WeeklyGoal.objects.get_or_create(
        user=user,
        defaults={
            'goal': 'Lose 0.5kg this week through diet and exercise',
        }
    )

    # Weight goal
    weight_goal, _ = WeightGoal.objects.get_or_create(
        user=user,
        defaults={
            'target_weight': 75.0,
        }
    )
    print("Created sample goals")
    return weekly_goal, weight_goal

def create_sample_documents(user):
    """Create sample document records (without actual files for demo)."""
    documents = [
        {
            'doc_type': 'care_plan',
            'title': 'Diabetes Care Plan 2024',
            'file': 'care_plan_2024.pdf',  # Placeholder
        },
        {
            'doc_type': 'lab_result',
            'title': 'Blood Work - March 2024',
            'file': 'lab_results_march.pdf',  # Placeholder
        },
        {
            'doc_type': 'lab_result',
            'title': 'HbA1c Test Results',
            'file': 'hba1c_test.pdf',  # Placeholder
        },
        {
            'doc_type': 'insurance_policy',
            'title': 'GIC Individual Medical Insurance Policy',
            'file': 'gic_mediclaim_policy.pdf',
        }
    ]

    created_docs = []
    for doc_data in documents:
        doc, created = UploadedDocument.objects.get_or_create(
            user=user,
            title=doc_data['title'],
            defaults={
                'doc_type': doc_data['doc_type'],
                'file': doc_data['file'],
                'uploaded_at': datetime.now() - timedelta(days=random.randint(1, 30)),
            }
        )
        if created:
            created_docs.append(doc)

    print(f"Created {len(created_docs)} sample document records")
    return created_docs

def seed_qdrant_documents(user, documents):
    """Add sample document content to Qdrant for AI processing."""
    try:
        from core.ai_memory import ingest_uploaded_document

        # Sample document contents (simulated parsing)
        sample_contents = {
            'Diabetes Care Plan 2024': """
            Diabetes Management Plan for Patient Demo User

            Current Medications:
            - Metformin 500mg twice daily
            - Lisinopril 10mg once daily

            Blood Sugar Targets:
            - Fasting: 80-130 mg/dL
            - Postprandial: <180 mg/dL

            Lifestyle Recommendations:
            - Exercise: 30 minutes moderate activity 5 days/week
            - Diet: Low carb, Mediterranean style
            - Weight goal: 75kg by Q3 2024

            Monitoring: Daily blood glucose checks, monthly HbA1c
            """,

            'Blood Work - March 2024': """
            Laboratory Results - March 15, 2024

            Glucose (Fasting): 142 mg/dL (High - target <130)
            HbA1c: 7.2% (Target <7.0%)
            Total Cholesterol: 198 mg/dL
            HDL: 45 mg/dL
            LDL: 120 mg/dL
            Triglycerides: 150 mg/dL

            Liver Function: Normal
            Kidney Function: eGFR 85 mL/min (Normal)
            """,

            'HbA1c Test Results': """
            Glycated Hemoglobin (HbA1c) Test Results

            Date: February 2024
            Result: 7.2%
            Reference Range: <5.7% (Normal), 5.7-6.4% (Prediabetes), ≥6.5% (Diabetes)

            Interpretation: Indicates poor glycemic control. Recommend lifestyle modifications and medication adjustment.
            """,

            'GIC Individual Medical Insurance Policy': """
Individual Mediclaim Policy Cases and Awards

This document contains various case studies and awards from the Insurance Ombudsman regarding mediclaim disputes in India. These cases illustrate common issues in health insurance claims, including:

1. Hospitalization Requirements: Many cases involve disputes over whether treatment requires 24-hour hospitalization or can be done as day care.

2. Pre-existing Conditions: Claims are often denied for diseases that existed before the policy inception, with waiting periods of 2-4 years.

3. Reasonable and Customary Charges: Insurers deduct amounts they consider excessive compared to standard rates in the area.

4. Non-disclosure: Claims rejected when material medical history was not disclosed in the proposal form.

5. Hospital Definition: Disputes over whether the treating facility meets the policy's definition of a hospital (minimum beds, registration).

Key Principles from Cases:
- Policies must be clear and terms communicated to insured
- Insurers must prove their repudiations with evidence
- Technological advancements may change what constitutes day care vs inpatient
- Pre-existing conditions have specific waiting periods
- Reasonable charges must be supported by local market data

Common Denials:
- Treatment not requiring 24-hour stay
- Pre-existing diseases within waiting period
- Charges exceeding reasonable limits
- Non-disclosure of material facts
- Treatment at non-registered hospitals

Important: This is not legal advice. Consult your insurance policy terms and a qualified professional for specific claims.
            """
        }

        for doc in documents:
            content = sample_contents.get(doc.title, f"Sample content for {doc.title}")
            print(f"Ingesting document: {doc.title}")

            # Since we don't have actual files, we'll simulate by creating a temporary file
            import tempfile
            import os
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
                f.write(content)
                temp_path = f.name

            try:
                # Use the actual ingestion function
                result = ingest_uploaded_document(
                    user_id=user.id,
                    doc_id=doc.id,
                    doc_type=doc.doc_type,
                    title=doc.title,
                    file_path=temp_path
                )
                print(f"Successfully ingested {doc.title} with {len(result.get('chunks', []))} chunks")
            finally:
                # Clean up temp file
                os.unlink(temp_path)

        print("Seeded sample documents into Qdrant")

    except Exception as e:
        print(f"Error seeding Qdrant: {e}")
        import traceback
        traceback.print_exc()

def main():
    print("Starting database seeding...")

    # Create sample user and profile
    user, profile = create_sample_user()

    # Create weight entries
    weight_entries = create_weight_entries(user)

    # Create goals
    weekly_goal, weight_goal = create_goals(user)

    # Create document records
    documents = create_sample_documents(user)

    # Seed Qdrant with document content
    seed_qdrant_documents(user, documents)

    print("\nSeeding complete!")
    print(f"Demo user: demo_user / demo123")
    print(f"Sample data created for user ID: {user.id}")
    print("\nYou can now:")
    print("1. Login with demo_user/demo123")
    print("2. View vitals, goals, and documents")
    print("3. Ask AI questions about health data")

if __name__ == '__main__':
    main()