# user_profiles/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, RoommateProfile

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = '__all__'

class RoommateProfileSerializer(serializers.ModelSerializer):
    user_profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = RoommateProfile
        fields = '__all__'