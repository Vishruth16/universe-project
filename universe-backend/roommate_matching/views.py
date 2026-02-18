# roommate_matching/views.py
from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from django.contrib.auth.models import User
from .models import MatchRequest, CompatibilityScore, RoommateMessage
from .serializers import MatchRequestSerializer, CompatibilityScoreSerializer, MatchProfileSerializer, RoommateMessageSerializer
from .utils import calculate_compatibility
from user_profiles.models import UserProfile, RoommateProfile

class MatchRequestViewSet(viewsets.ModelViewSet):
    queryset = MatchRequest.objects.all().order_by('-created_at')
    serializer_class = MatchRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return MatchRequest.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check if a request already exists
        receiver_id = serializer.validated_data.get('receiver').id
        existing_request = MatchRequest.objects.filter(
            (Q(sender=request.user) & Q(receiver_id=receiver_id)) |
            (Q(sender_id=receiver_id) & Q(receiver=request.user))
        ).first()
        
        if existing_request:
            return Response(
                {"detail": "A match request already exists between these users."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer.save(sender=request.user, status='pending')
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        match_request = self.get_object()
        
        if match_request.receiver != request.user:
            return Response(
                {"detail": "You don't have permission to accept this request."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        match_request.status = 'accepted'
        match_request.save()
        
        return Response({"status": "Match request accepted"})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        match_request = self.get_object()
        
        if match_request.receiver != request.user:
            return Response(
                {"detail": "You don't have permission to reject this request."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        match_request.status = 'rejected'
        match_request.save()
        
        return Response({"status": "Match request rejected"})

class RoommateMatchingViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def retrieve(self, request, pk=None):
        """
        Get a specific roommate profile with compatibility score
        """
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            roommate_profile = RoommateProfile.objects.get(user_profile=user_profile)
        except (UserProfile.DoesNotExist, RoommateProfile.DoesNotExist):
            return Response(
                {"detail": "Please complete your profile to view matches."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            other_user = User.objects.get(id=pk)
            other_user_profile = UserProfile.objects.get(user=other_user)
            other_roommate_profile = RoommateProfile.objects.get(user_profile=other_user_profile)
        except (User.DoesNotExist, UserProfile.DoesNotExist, RoommateProfile.DoesNotExist):
            return Response(
                {"detail": "Roommate profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Calculate compatibility
        compatibility, created = CompatibilityScore.objects.get_or_create(
            user1=request.user,
            user2=other_user,
            defaults={'score': self._calculate_compatibility(roommate_profile, other_roommate_profile)}
        )
        if not created:
            compatibility.score = self._calculate_compatibility(roommate_profile, other_roommate_profile)
            compatibility.save()

        # Get match status
        match_request = MatchRequest.objects.filter(
            (Q(sender=request.user) & Q(receiver=other_user)) |
            (Q(sender=other_user) & Q(receiver=request.user))
        ).first()

        match_data = {
            'user': other_user,
            'profile': other_user_profile,
            'roommate_profile': other_roommate_profile,
            'compatibility_score': compatibility.score,
            'match_status': match_request.status if match_request else 'none',
        }

        serializer = MatchProfileSerializer(match_data)
        return Response(serializer.data)

    def list(self, request):
        """
        Get potential roommate matches for the current user
        """
        # Get current user's profile and preferences
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            roommate_profile = RoommateProfile.objects.get(user_profile=user_profile)
        except (UserProfile.DoesNotExist, RoommateProfile.DoesNotExist):
            return Response(
                {"detail": "Please complete your profile to find matches."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all users with roommate profiles, excluding current user
        other_profiles = RoommateProfile.objects.exclude(
            user_profile__user=request.user
        ).select_related('user_profile__user')
        
        # Calculate compatibility scores
        matches = []
        for other_profile in other_profiles:
            other_user = other_profile.user_profile.user
            
            # Get existing compatibility score or calculate a new one
            compatibility, created = CompatibilityScore.objects.get_or_create(
                user1=request.user,
                user2=other_user,
                defaults={'score': self._calculate_compatibility(roommate_profile, other_profile)}
            )
            
            # If the score is old, recalculate it
            if created is False:
                compatibility.score = self._calculate_compatibility(roommate_profile, other_profile)
                compatibility.save()
            
            # Get match status if any
            match_request = MatchRequest.objects.filter(
                (Q(sender=request.user) & Q(receiver=other_user)) |
                (Q(sender=other_user) & Q(receiver=request.user))
            ).first()
            
            match_status = match_request.status if match_request else 'none'
            
            # Add to matches
            matches.append({
                'user': other_user,
                'profile': other_profile.user_profile,
                'roommate_profile': other_profile,
                'compatibility_score': compatibility.score,
                'match_status': match_status
            })
        
        # Sort by compatibility score (highest first)
        matches.sort(key=lambda x: x['compatibility_score'], reverse=True)
        
        serializer = MatchProfileSerializer(matches, many=True)
        return Response(serializer.data)
    
    def _calculate_compatibility(self, user_profile, other_profile):
        return calculate_compatibility(user_profile, other_profile)


class RoommateMessageViewSet(viewsets.ModelViewSet):
    serializer_class = RoommateMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return RoommateMessage.objects.filter(
            match_request__in=MatchRequest.objects.filter(
                Q(sender=user) | Q(receiver=user),
                status='accepted',
            )
        ).order_by('-timestamp')

    def create(self, request, *args, **kwargs):
        match_request_id = request.data.get('match_request')
        try:
            match_req = MatchRequest.objects.get(
                id=match_request_id,
                status='accepted',
            )
        except MatchRequest.DoesNotExist:
            return Response(
                {"detail": "Match request not found or not accepted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.user not in (match_req.sender, match_req.receiver):
            return Response(
                {"detail": "You are not part of this match."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def by_match(self, request):
        match_request_id = request.query_params.get('match_request_id')
        if not match_request_id:
            return Response(
                {"detail": "match_request_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            match_req = MatchRequest.objects.get(
                id=match_request_id,
                status='accepted',
            )
        except MatchRequest.DoesNotExist:
            return Response(
                {"detail": "Match request not found or not accepted."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if request.user not in (match_req.sender, match_req.receiver):
            return Response(
                {"detail": "You are not part of this match."},
                status=status.HTTP_403_FORBIDDEN,
            )

        messages = RoommateMessage.objects.filter(
            match_request=match_req
        ).order_by('timestamp')

        # Mark unread messages as read
        messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)

        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = RoommateMessage.objects.filter(
            match_request__in=MatchRequest.objects.filter(
                Q(sender=request.user) | Q(receiver=request.user),
                status='accepted',
            ),
            is_read=False,
        ).exclude(sender=request.user).count()
        return Response({'count': count})

    @action(detail=False, methods=['get'])
    def conversations(self, request):
        user = request.user
        accepted_matches = MatchRequest.objects.filter(
            Q(sender=user) | Q(receiver=user),
            status='accepted',
        ).select_related('sender', 'receiver')

        conversations = []
        for match in accepted_matches:
            other_user = match.receiver if match.sender == user else match.sender
            last_msg = RoommateMessage.objects.filter(
                match_request=match
            ).order_by('-timestamp').first()

            unread = RoommateMessage.objects.filter(
                match_request=match,
                is_read=False,
            ).exclude(sender=user).count()

            conversations.append({
                'type': 'roommate',
                'match_request_id': match.id,
                'other_user_id': other_user.id,
                'other_username': other_user.username,
                'last_message': last_msg.content if last_msg else '',
                'timestamp': last_msg.timestamp.isoformat() if last_msg else match.updated_at.isoformat(),
                'unread_count': unread,
            })

        conversations.sort(key=lambda c: c['timestamp'], reverse=True)
        return Response(conversations)