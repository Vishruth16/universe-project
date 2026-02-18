from django.contrib import admin
from .models import MatchRequest, CompatibilityScore, RoommateMessage


@admin.register(MatchRequest)
class MatchRequestAdmin(admin.ModelAdmin):
    list_display = ['sender', 'receiver', 'status', 'created_at']
    list_filter = ['status']


@admin.register(CompatibilityScore)
class CompatibilityScoreAdmin(admin.ModelAdmin):
    list_display = ['user1', 'user2', 'score', 'last_calculated']


@admin.register(RoommateMessage)
class RoommateMessageAdmin(admin.ModelAdmin):
    list_display = ['match_request', 'sender', 'content', 'timestamp', 'is_read']
    list_filter = ['is_read']
