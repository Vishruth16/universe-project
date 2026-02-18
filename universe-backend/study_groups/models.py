from django.db import models
from django.contrib.auth.models import User


class StudyGroup(models.Model):
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('biweekly', 'Biweekly'),
        ('monthly', 'Monthly'),
        ('as_needed', 'As Needed'),
    ]

    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_study_groups')
    name = models.CharField(max_length=200)
    course_code = models.CharField(max_length=20, blank=True, default='')
    subject_area = models.CharField(max_length=100)
    description = models.TextField()
    max_members = models.IntegerField(default=10)
    meeting_location = models.CharField(max_length=255, blank=True, default='')
    meeting_schedule = models.CharField(max_length=255, blank=True, default='')
    meeting_frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='weekly')
    is_online = models.BooleanField(default=False)
    meeting_link = models.URLField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    @property
    def member_count(self):
        return self.memberships.filter(is_active=True).count()

    @property
    def is_full(self):
        return self.member_count >= self.max_members

    class Meta:
        ordering = ['-created_date']

    def __str__(self):
        return f"{self.name} ({self.subject_area})"


class GroupMembership(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('member', 'Member'),
    ]

    group = models.ForeignKey(StudyGroup, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='study_group_memberships')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member')
    is_active = models.BooleanField(default=True)
    joined_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['group', 'user']

    def __str__(self):
        return f"{self.user.username} in {self.group.name} ({self.role})"


class GroupMessage(models.Model):
    group = models.ForeignKey(StudyGroup, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='study_group_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender.username} in {self.group.name}: {self.content[:50]}"
