from django.apps import AppConfig


class AiRecommendationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ai_recommendations'

    def ready(self):
        from django.db.models.signals import post_save, post_delete
        from housing.models import HousingListing
        from marketplace.models import MarketplaceItem
        from study_groups.models import StudyGroup
        from user_profiles.models import UserProfile, RoommateProfile
        from . import faiss_service

        def invalidate_housing_cache(sender, **kwargs):
            faiss_service.invalidate_cache('housing')

        def invalidate_marketplace_cache(sender, **kwargs):
            faiss_service.invalidate_cache('marketplace')

        def invalidate_study_groups_cache(sender, **kwargs):
            faiss_service.invalidate_cache('study_groups')

        def invalidate_roommate_cache(sender, **kwargs):
            faiss_service.invalidate_cache('roommate')

        for signal in [post_save, post_delete]:
            signal.connect(invalidate_housing_cache, sender=HousingListing)
            signal.connect(invalidate_marketplace_cache, sender=MarketplaceItem)
            signal.connect(invalidate_study_groups_cache, sender=StudyGroup)
            signal.connect(invalidate_roommate_cache, sender=UserProfile)
            signal.connect(invalidate_roommate_cache, sender=RoommateProfile)
