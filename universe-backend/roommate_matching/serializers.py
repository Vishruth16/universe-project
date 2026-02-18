# roommate_matching/serializers.py
from rest_framework import serializers
from .models import MatchRequest, CompatibilityScore, RoommateMessage
from user_profiles.serializers import UserSerializer, UserProfileSerializer, RoommateProfileSerializer
from user_profiles.models import UserProfile, RoommateProfile

class MatchRequestSerializer(serializers.ModelSerializer):
    sender_detail = UserSerializer(source='sender', read_only=True)
    receiver_detail = UserSerializer(source='receiver', read_only=True)
    
    class Meta:
        model = MatchRequest
        fields = '__all__'
        read_only_fields = ['sender', 'status']

class CompatibilityScoreSerializer(serializers.ModelSerializer):
    user1_detail = UserSerializer(source='user1', read_only=True)
    user2_detail = UserSerializer(source='user2', read_only=True)
    
    class Meta:
        model = CompatibilityScore
        fields = '__all__'
        read_only_fields = ['user1', 'user2', 'score', 'last_calculated']

class RoommateMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.SerializerMethodField()

    class Meta:
        model = RoommateMessage
        fields = ['id', 'match_request', 'sender', 'sender_username', 'content', 'timestamp', 'is_read']
        read_only_fields = ['sender']

    def get_sender_username(self, obj):
        return obj.sender.username

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)


class MatchProfileSerializer(serializers.Serializer):
    user = UserSerializer(read_only=True)
    profile = UserProfileSerializer(read_only=True)
    roommate_profile = RoommateProfileSerializer(read_only=True)
    compatibility_score = serializers.FloatField(read_only=True)
    match_status = serializers.CharField(read_only=True)