def build_user_profile_text(profile, roommate_profile=None):
    """Build a semantic text representation of a user profile for embedding."""
    parts = []

    if profile.first_name or profile.last_name:
        parts.append(f"Student: {profile.first_name} {profile.last_name}")

    if profile.course_major:
        parts.append(f"Major: {profile.course_major}")

    if profile.bio:
        parts.append(f"Bio: {profile.bio}")

    if profile.interests:
        parts.append(f"Interests: {profile.interests}")

    if roommate_profile:
        lifestyle = []
        if roommate_profile.sleep_habits:
            lifestyle.append(f"sleep habits: {roommate_profile.sleep_habits}")
        if roommate_profile.study_habits:
            lifestyle.append(f"study habits: {roommate_profile.study_habits}")
        if roommate_profile.smoking_preference:
            lifestyle.append(f"smoking: {roommate_profile.smoking_preference}")
        if roommate_profile.drinking_preference:
            lifestyle.append(f"drinking: {roommate_profile.drinking_preference}")
        if roommate_profile.guests_preference:
            lifestyle.append(f"guests: {roommate_profile.guests_preference}")
        if roommate_profile.cleanliness_level:
            lifestyle.append(f"cleanliness: {roommate_profile.cleanliness_level}/5")
        if roommate_profile.max_rent_budget:
            lifestyle.append(f"budget: ${roommate_profile.max_rent_budget}")
        if lifestyle:
            parts.append(f"Lifestyle: {', '.join(lifestyle)}")

    return ". ".join(parts) if parts else "Student profile"


def build_housing_listing_text(listing):
    """Build a semantic text representation of a housing listing for embedding."""
    parts = [
        f"Housing: {listing.title}",
        f"Type: {listing.housing_type}",
        f"Location: {listing.address}, {listing.city}, {listing.state}",
        f"Rent: ${listing.rent_price}/month",
        f"{listing.bedrooms} bed, {listing.bathrooms} bath",
    ]

    if listing.sq_ft:
        parts.append(f"{listing.sq_ft} sq ft")

    if listing.lease_type:
        parts.append(f"Lease: {listing.lease_type}")

    if listing.distance_to_campus:
        parts.append(f"Distance to campus: {listing.distance_to_campus} miles")

    amenities = []
    if listing.furnished:
        amenities.append("furnished")
    if listing.pets_allowed:
        amenities.append("pets allowed")
    if listing.parking:
        amenities.append("parking")
    if listing.laundry:
        amenities.append("laundry")
    if listing.wifi_included:
        amenities.append("wifi")
    if listing.ac:
        amenities.append("AC")
    if listing.utilities_included:
        amenities.append("utilities included")
    if amenities:
        parts.append(f"Amenities: {', '.join(amenities)}")

    if listing.description:
        parts.append(f"Description: {listing.description[:300]}")

    return ". ".join(parts)


def build_marketplace_item_text(item):
    """Build a semantic text representation of a marketplace item for embedding."""
    parts = [
        f"Item: {item.title}",
        f"Category: {item.item_type}",
        f"Price: ${item.price}",
        f"Condition: {item.condition}",
    ]

    if item.location:
        parts.append(f"Location: {item.location}")

    if item.description:
        parts.append(f"Description: {item.description[:300]}")

    return ". ".join(parts)


def build_study_group_text(group):
    """Build a semantic text representation of a study group for embedding."""
    parts = [
        f"Study Group: {group.name}",
        f"Subject: {group.subject_area}",
    ]

    if group.course_code:
        parts.append(f"Course: {group.course_code}")

    if group.meeting_frequency:
        parts.append(f"Meets: {group.meeting_frequency}")

    if group.is_online:
        parts.append("Online group")
    elif group.meeting_location:
        parts.append(f"Location: {group.meeting_location}")

    if group.meeting_schedule:
        parts.append(f"Schedule: {group.meeting_schedule}")

    if group.description:
        parts.append(f"Description: {group.description[:300]}")

    return ". ".join(parts)
