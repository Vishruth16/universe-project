# user_profiles/views.py
from rest_framework import viewsets, permissions
from django.contrib.auth.models import User
from .models import UserProfile, RoommateProfile
from .serializers import UserSerializer, UserProfileSerializer, RoommateProfileSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all().order_by('id')
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.query_params.get('current_user', None):
            return UserProfile.objects.filter(user=self.request.user).order_by('id')
        return super().get_queryset()

class RoommateProfileViewSet(viewsets.ModelViewSet):
    queryset = RoommateProfile.objects.all().order_by('id')
    serializer_class = RoommateProfileSerializer
    permission_classes = [permissions.IsAuthenticated]