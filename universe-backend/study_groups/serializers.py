from rest_framework import serializers
from .models import StudyGroup, GroupMembership, GroupMessage


class GroupMembershipSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()

    class Meta:
        model = GroupMembership
        fields = ['id', 'user', 'username', 'role', 'is_active', 'joined_date']
        read_only_fields = ['user']

    def get_username(self, obj):
        return obj.user.username


class GroupMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.SerializerMethodField()

    class Meta:
        model = GroupMessage
        fields = ['id', 'group', 'sender', 'sender_username', 'content', 'timestamp']
        read_only_fields = ['sender']

    def get_sender_username(self, obj):
        return obj.sender.username

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)


class StudyGroupSerializer(serializers.ModelSerializer):
    members = GroupMembershipSerializer(source='memberships', many=True, read_only=True)
    creator_username = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()

    class Meta:
        model = StudyGroup
        fields = '__all__'
        read_only_fields = ['creator']

    def get_creator_username(self, obj):
        return obj.creator.username

    def get_member_count(self, obj):
        return obj.member_count

    def get_is_full(self, obj):
        return obj.is_full

    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.memberships.filter(user=request.user, is_active=True).exists()
        return False

    def get_user_role(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            membership = obj.memberships.filter(user=request.user, is_active=True).first()
            return membership.role if membership else None
        return None

    def create(self, validated_data):
        validated_data['creator'] = self.context['request'].user
        group = super().create(validated_data)
        # Auto-add creator as admin
        GroupMembership.objects.create(group=group, user=group.creator, role='admin')
        return group
