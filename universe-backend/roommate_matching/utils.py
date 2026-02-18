def calculate_compatibility(user_profile, other_profile):
    """
    Calculate compatibility score between two roommate profiles.
    Returns a score between 0-100.
    """
    score = 0
    total_weight = 0

    # Smoking preference (weight: 15)
    if user_profile.smoking_preference != 'no_preference' and other_profile.smoking_preference != 'no_preference':
        weight = 15
        total_weight += weight
        if user_profile.smoking_preference == other_profile.smoking_preference:
            score += weight

    # Drinking preference (weight: 10)
    if user_profile.drinking_preference != 'no_preference' and other_profile.drinking_preference != 'no_preference':
        weight = 10
        total_weight += weight
        if user_profile.drinking_preference == other_profile.drinking_preference:
            score += weight

    # Sleep habits (weight: 20)
    if user_profile.sleep_habits != 'no_preference' and other_profile.sleep_habits != 'no_preference':
        weight = 20
        total_weight += weight
        if user_profile.sleep_habits == other_profile.sleep_habits:
            score += weight

    # Study habits (weight: 15)
    if user_profile.study_habits != 'no_preference' and other_profile.study_habits != 'no_preference':
        weight = 15
        total_weight += weight
        if user_profile.study_habits == other_profile.study_habits:
            score += weight

    # Guests preference (weight: 10)
    if user_profile.guests_preference != 'no_preference' and other_profile.guests_preference != 'no_preference':
        weight = 10
        total_weight += weight
        if user_profile.guests_preference == other_profile.guests_preference:
            score += weight

    # Cleanliness level (weight: 20)
    weight = 20
    total_weight += weight
    cleanliness_diff = abs(user_profile.cleanliness_level - other_profile.cleanliness_level)
    if cleanliness_diff == 0:
        score += weight
    elif cleanliness_diff == 1:
        score += weight * 0.7
    elif cleanliness_diff == 2:
        score += weight * 0.4

    # Budget compatibility (weight: 10)
    if user_profile.max_rent_budget and other_profile.max_rent_budget:
        weight = 10
        total_weight += weight
        budget_diff_percentage = abs(user_profile.max_rent_budget - other_profile.max_rent_budget) / max(user_profile.max_rent_budget, other_profile.max_rent_budget)
        if budget_diff_percentage <= 0.1:
            score += weight
        elif budget_diff_percentage <= 0.2:
            score += weight * 0.7
        elif budget_diff_percentage <= 0.3:
            score += weight * 0.4

    # Calculate final percentage score
    final_score = (score / total_weight * 100) if total_weight > 0 else 50
    return round(final_score, 1)
