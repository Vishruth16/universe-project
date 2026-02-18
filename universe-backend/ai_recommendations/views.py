from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from .rag_pipeline import (
    get_housing_recommendations,
    get_roommate_recommendations,
    get_marketplace_recommendations,
    get_study_group_recommendations,
)


class HousingRecommendationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from housing.models import HousingListing
        from housing.serializers import HousingListingSerializer

        top_k = int(request.query_params.get('limit', 10))
        recommendations = get_housing_recommendations(request.user, top_k=top_k)

        results = []
        for item_id, score in recommendations:
            try:
                listing = HousingListing.objects.get(id=item_id)
                serializer = HousingListingSerializer(listing, context={'request': request})
                results.append({
                    'id': item_id,
                    'similarity_score': round(score, 4),
                    'data': serializer.data,
                })
            except HousingListing.DoesNotExist:
                continue

        return Response(results)


class RoommateRecommendationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from user_profiles.models import UserProfile
        from user_profiles.serializers import UserProfileSerializer

        top_k = int(request.query_params.get('limit', 10))
        recommendations = get_roommate_recommendations(request.user, top_k=top_k)

        results = []
        for user_id, score in recommendations:
            try:
                profile = UserProfile.objects.get(user_id=user_id)
                serializer = UserProfileSerializer(profile, context={'request': request})
                results.append({
                    'id': user_id,
                    'similarity_score': round(score, 4),
                    'data': serializer.data,
                })
            except UserProfile.DoesNotExist:
                continue

        return Response(results)


class MarketplaceRecommendationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from marketplace.models import MarketplaceItem
        from marketplace.serializers import MarketplaceItemSerializer

        top_k = int(request.query_params.get('limit', 10))
        recommendations = get_marketplace_recommendations(request.user, top_k=top_k)

        results = []
        for item_id, score in recommendations:
            try:
                item = MarketplaceItem.objects.get(id=item_id)
                serializer = MarketplaceItemSerializer(item, context={'request': request})
                results.append({
                    'id': item_id,
                    'similarity_score': round(score, 4),
                    'data': serializer.data,
                })
            except MarketplaceItem.DoesNotExist:
                continue

        return Response(results)


class StudyGroupRecommendationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from study_groups.models import StudyGroup
        from study_groups.serializers import StudyGroupSerializer

        top_k = int(request.query_params.get('limit', 10))
        recommendations = get_study_group_recommendations(request.user, top_k=top_k)

        results = []
        for group_id, score in recommendations:
            try:
                group = StudyGroup.objects.get(id=group_id)
                serializer = StudyGroupSerializer(group, context={'request': request})
                results.append({
                    'id': group_id,
                    'similarity_score': round(score, 4),
                    'data': serializer.data,
                })
            except StudyGroup.DoesNotExist:
                continue

        return Response(results)
