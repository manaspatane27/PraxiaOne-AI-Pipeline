from .models import WeightGoal, WeightEntry, UserProfile

def build_ai_context(user, consent):
    """
    Returns ONLY consented data.
    """
    context = []
    used_scopes = []

    # PROFILE
    profile, _ = UserProfile.objects.get_or_create(user=user)
    if profile and profile.full_name:
        context.append("User has a health profile.")
        used_scopes.append("profile")

    # VITALS
    if consent.vitals_allowed:
        goal = WeightGoal.objects.filter(user=user).last()
        entry = WeightEntry.objects.filter(user=user).last()

        if goal and entry:
            context.append(
                f"Weight trend: current {entry.current_weight} kg, target {goal.target_weight} kg."
            )
            used_scopes.append("vitals")

    # LABS / CARE PLANS — future-ready (no parsing yet)
    if consent.lab_results_allowed:
        context.append("Lab results are available but not parsed.")
        used_scopes.append("labs")

    if consent.care_plan_allowed:
        context.append("Care plans are available.")
        used_scopes.append("care_plans")

    return {
        "context_text": "\n".join(context) if context else "No personal health data was used.",
        "used_scopes": used_scopes,
    }
