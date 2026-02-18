from django.db import models
from django.contrib.auth.models import User


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('match_request', 'Match Request'),
        ('match_accepted', 'Match Accepted'),
        ('match_rejected', 'Match Rejected'),
        ('roommate_message', 'Roommate Message'),
        ('marketplace_message', 'Marketplace Message'),
        ('housing_inquiry', 'Housing Inquiry'),
        ('group_message', 'Group Message'),
    ]

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='sent_notifications')
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField(blank=True, default='')
    link = models.CharField(max_length=500, blank=True, default='')
    related_id = models.IntegerField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read', '-created_at']),
        ]

    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.title}"
