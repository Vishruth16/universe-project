from django.urls import path
from .views import (
    HousingRecommendationView,
    RoommateRecommendationView,
    MarketplaceRecommendationView,
    StudyGroupRecommendationView,
)

urlpatterns = [
    path('housing/', HousingRecommendationView.as_view(), name='housing-recommendations'),
    path('roommates/', RoommateRecommendationView.as_view(), name='roommate-recommendations'),
    path('marketplace/', MarketplaceRecommendationView.as_view(), name='marketplace-recommendations'),
    path('study-groups/', StudyGroupRecommendationView.as_view(), name='study-group-recommendations'),
]
