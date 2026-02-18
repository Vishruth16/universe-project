"""
URL configuration for universe_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# universe_backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from user_profiles.views import UserViewSet, UserProfileViewSet, RoommateProfileViewSet
from marketplace.views import MarketplaceItemViewSet, MarketplaceMessageViewSet
from roommate_matching.views import MatchRequestViewSet, RoommateMatchingViewSet, RoommateMessageViewSet
from housing.views import HousingListingViewSet, HousingInquiryViewSet
from study_groups.views import StudyGroupViewSet
from notifications.views import NotificationViewSet


router = DefaultRouter()
# User Profiles
router.register(r'users', UserViewSet)
router.register(r'profiles', UserProfileViewSet)
router.register(r'roommate-profiles', RoommateProfileViewSet)
# Marketplace
router.register(r'marketplace-items', MarketplaceItemViewSet)
router.register(r'marketplace-messages', MarketplaceMessageViewSet)
# Roommate Matching
router.register(r'match-requests', MatchRequestViewSet)
router.register(r'roommate-matches', RoommateMatchingViewSet, basename='roommate-matches')
router.register(r'roommate-messages', RoommateMessageViewSet, basename='roommate-messages')
# Housing
router.register(r'housing-listings', HousingListingViewSet)
router.register(r'housing-inquiries', HousingInquiryViewSet)
# Study Groups
router.register(r'study-groups', StudyGroupViewSet)
# Notifications
router.register(r'notifications', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls')),
    path('api/auth/', include('auth_api.urls')),
    path('api/recommendations/', include('ai_recommendations.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

