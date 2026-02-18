from django.contrib import admin
from .models import StudyGroup, GroupMembership, GroupMessage


@admin.register(StudyGroup)
class StudyGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'subject_area', 'course_code', 'creator', 'is_active', 'created_date']
    list_filter = ['subject_area', 'is_online', 'is_active', 'meeting_frequency']
    search_fields = ['name', 'course_code', 'subject_area', 'description']


@admin.register(GroupMembership)
class GroupMembershipAdmin(admin.ModelAdmin):
    list_display = ['group', 'user', 'role', 'is_active', 'joined_date']
    list_filter = ['role', 'is_active']


@admin.register(GroupMessage)
class GroupMessageAdmin(admin.ModelAdmin):
    list_display = ['group', 'sender', 'content', 'timestamp']
