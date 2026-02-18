from langchain_core.prompts import PromptTemplate

from . import embeddings as emb
from . import faiss_service
from .text_builders import (
    build_user_profile_text,
    build_housing_listing_text,
    build_marketplace_item_text,
    build_study_group_text,
)

# --- Prompt Templates ---

HOUSING_RECOMMENDATION_PROMPT = PromptTemplate(
    input_variables=["user_profile", "preferences"],
    template=(
        "Based on the following student profile:\n{user_profile}\n\n"
        "And their housing preferences:\n{preferences}\n\n"
        "Find the most suitable housing listings that match their needs, "
        "considering budget, location, amenities, and lifestyle compatibility."
    ),
)

ROOMMATE_RECOMMENDATION_PROMPT = PromptTemplate(
    input_variables=["user_profile"],
    template=(
        "Based on the following student profile:\n{user_profile}\n\n"
        "Find the most compatible roommate candidates based on lifestyle preferences, "
        "study habits, sleep schedules, cleanliness, and budget compatibility."
    ),
)

MARKETPLACE_RECOMMENDATION_PROMPT = PromptTemplate(
    input_variables=["user_profile", "interests"],
    template=(
        "Based on the following student profile:\n{user_profile}\n\n"
        "And their interests:\n{interests}\n\n"
        "Find marketplace items that this student would likely be interested in purchasing."
    ),
)

STUDY_GROUP_RECOMMENDATION_PROMPT = PromptTemplate(
    input_variables=["user_profile", "major"],
    template=(
        "Based on the following student profile:\n{user_profile}\n\n"
        "Studying: {major}\n\n"
        "Find study groups that would be most beneficial for this student "
        "based on their major, interests, and study habits."
    ),
)


# --- Hybrid Filters ---

def hybrid_filter_housing(listings, user_profile, roommate_profile=None):
    """Rule-based pre-filter for housing listings."""
    filtered = []
    budget = None
    if roommate_profile and roommate_profile.max_rent_budget:
        budget = float(roommate_profile.max_rent_budget)

    for listing in listings:
        # Skip unavailable
        if not listing.is_available:
            continue
        # Budget filter: allow up to 20% over budget
        if budget and float(listing.rent_price) > budget * 1.2:
            continue
        filtered.append(listing)

    return filtered


def hybrid_filter_marketplace(items):
    """Rule-based pre-filter for marketplace items."""
    return [item for item in items if not item.is_sold]


def hybrid_filter_study_groups(groups):
    """Rule-based pre-filter for study groups."""
    return [g for g in groups if g.is_active and not g.is_full]


# --- Cold Start Detection ---

def is_cold_start_user(profile, roommate_profile=None):
    """
    Determine if a user is a cold-start user (< 2 of 4 signals).
    Signals: bio, interests, major, roommate preferences.
    """
    signals = 0
    if profile.bio and len(profile.bio.strip()) > 10:
        signals += 1
    if profile.interests and len(profile.interests.strip()) > 5:
        signals += 1
    if profile.course_major and len(profile.course_major.strip()) > 2:
        signals += 1
    if roommate_profile:
        signals += 1
    return signals < 2


def get_cold_start_recommendations(model_class, limit=10):
    """Fallback: return most recent items for cold-start users."""
    return list(model_class.objects.all().order_by('-pk')[:limit])


# --- Recommendation Pipelines ---

def get_housing_recommendations(user, top_k=10):
    """Full RAG pipeline for housing recommendations."""
    from user_profiles.models import UserProfile, RoommateProfile
    from housing.models import HousingListing

    try:
        profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        return get_cold_start_recommendations(HousingListing, top_k)

    roommate_profile = getattr(profile, 'roommateprofile', None)

    if is_cold_start_user(profile, roommate_profile):
        listings = get_cold_start_recommendations(HousingListing, top_k)
        return [(l.id, 0.0) for l in listings]

    # Build query text
    query_text = build_user_profile_text(profile, roommate_profile)

    # Semantic search
    query_embedding = emb.embed_text(query_text)
    results = faiss_service.search_similar('housing', query_embedding, top_k=top_k * 3)

    if not results:
        listings = get_cold_start_recommendations(HousingListing, top_k)
        return [(l.id, 0.0) for l in listings]

    # Hybrid filter
    result_ids = [r[0] for r in results]
    score_map = {r[0]: r[1] for r in results}
    listings = HousingListing.objects.filter(id__in=result_ids)
    filtered = hybrid_filter_housing(listings, profile, roommate_profile)

    # Re-rank by score
    ranked = sorted(filtered, key=lambda l: score_map.get(l.id, 0), reverse=True)
    return [(l.id, score_map.get(l.id, 0.0)) for l in ranked[:top_k]]


def get_roommate_recommendations(user, top_k=10):
    """Full RAG pipeline for roommate recommendations."""
    from user_profiles.models import UserProfile, RoommateProfile

    try:
        profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        return []

    roommate_profile = getattr(profile, 'roommateprofile', None)

    if is_cold_start_user(profile, roommate_profile):
        profiles = UserProfile.objects.exclude(user=user).order_by('-date_joined')[:top_k]
        return [(p.user.id, 0.0) for p in profiles]

    # Build query text
    query_text = build_user_profile_text(profile, roommate_profile)

    # Semantic search
    query_embedding = emb.embed_text(query_text)
    results = faiss_service.search_similar(
        'roommate', query_embedding, top_k=top_k, exclude_ids={user.id}
    )

    if not results:
        profiles = UserProfile.objects.exclude(user=user).order_by('-date_joined')[:top_k]
        return [(p.user.id, 0.0) for p in profiles]

    return results[:top_k]


def get_marketplace_recommendations(user, top_k=10):
    """Full RAG pipeline for marketplace recommendations."""
    from user_profiles.models import UserProfile
    from marketplace.models import MarketplaceItem

    try:
        profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        items = get_cold_start_recommendations(MarketplaceItem, top_k)
        return [(i.id, 0.0) for i in items]

    roommate_profile = getattr(profile, 'roommateprofile', None)

    if is_cold_start_user(profile, roommate_profile):
        items = get_cold_start_recommendations(MarketplaceItem, top_k)
        return [(i.id, 0.0) for i in items]

    # Build query text
    query_text = build_user_profile_text(profile, roommate_profile)

    # Semantic search
    query_embedding = emb.embed_text(query_text)
    results = faiss_service.search_similar(
        'marketplace', query_embedding, top_k=top_k * 3, exclude_ids=set()
    )

    if not results:
        items = get_cold_start_recommendations(MarketplaceItem, top_k)
        return [(i.id, 0.0) for i in items]

    # Hybrid filter
    result_ids = [r[0] for r in results]
    score_map = {r[0]: r[1] for r in results}
    items = MarketplaceItem.objects.filter(id__in=result_ids)
    filtered = hybrid_filter_marketplace(items)

    ranked = sorted(filtered, key=lambda i: score_map.get(i.id, 0), reverse=True)
    return [(i.id, score_map.get(i.id, 0.0)) for i in ranked[:top_k]]


def get_study_group_recommendations(user, top_k=10):
    """Full RAG pipeline for study group recommendations."""
    from user_profiles.models import UserProfile
    from study_groups.models import StudyGroup

    try:
        profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        groups = get_cold_start_recommendations(StudyGroup, top_k)
        return [(g.id, 0.0) for g in groups]

    roommate_profile = getattr(profile, 'roommateprofile', None)

    if is_cold_start_user(profile, roommate_profile):
        groups = get_cold_start_recommendations(StudyGroup, top_k)
        return [(g.id, 0.0) for g in groups]

    # Build query text
    query_text = build_user_profile_text(profile, roommate_profile)

    # Semantic search
    query_embedding = emb.embed_text(query_text)
    results = faiss_service.search_similar(
        'study_groups', query_embedding, top_k=top_k * 3, exclude_ids=set()
    )

    if not results:
        groups = get_cold_start_recommendations(StudyGroup, top_k)
        return [(g.id, 0.0) for g in groups]

    # Hybrid filter
    result_ids = [r[0] for r in results]
    score_map = {r[0]: r[1] for r in results}
    groups = StudyGroup.objects.filter(id__in=result_ids)
    filtered = hybrid_filter_study_groups(groups)

    ranked = sorted(filtered, key=lambda g: score_map.get(g.id, 0), reverse=True)
    return [(g.id, score_map.get(g.id, 0.0)) for g in ranked[:top_k]]
