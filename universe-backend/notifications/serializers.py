from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    sender_username = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'sender', 'sender_username',
            'notification_type', 'title', 'message', 'link',
            'related_id', 'is_read', 'created_at',
        ]
        read_only_fields = [
            'id', 'recipient', 'sender', 'sender_username',
            'notification_type', 'title', 'message', 'link',
            'related_id', 'created_at',
        ]

    def get_sender_username(self, obj):
        return obj.sender.username if obj.sender else None
