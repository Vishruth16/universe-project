from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import StudyGroup, GroupMembership, GroupMessage
from .serializers import StudyGroupSerializer, GroupMembershipSerializer, GroupMessageSerializer


class StudyGroupViewSet(viewsets.ModelViewSet):
    queryset = StudyGroup.objects.all().order_by('-created_date')
    serializer_class = StudyGroupSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'course_code', 'subject_area', 'description']
    ordering_fields = ['created_date', 'name']

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by subject area
        subject_area = self.request.query_params.get('subject_area', None)
        if subject_area:
            queryset = queryset.filter(subject_area__icontains=subject_area)

        # Filter by course code
        course_code = self.request.query_params.get('course_code', None)
        if course_code:
            queryset = queryset.filter(course_code__icontains=course_code)

        # Filter by online/in-person
        is_online = self.request.query_params.get('is_online', None)
        if is_online is not None:
            queryset = queryset.filter(is_online=is_online.lower() == 'true')

        # Filter by user's groups
        my_groups = self.request.query_params.get('my_groups', None)
        if my_groups and self.request.user.is_authenticated:
            queryset = queryset.filter(memberships__user=self.request.user, memberships__is_active=True)

        # Filter groups with available spots
        has_spots = self.request.query_params.get('has_spots', None)
        if has_spots and has_spots.lower() == 'true':
            queryset = [g for g in queryset if not g.is_full]
            return queryset

        # Filter active only
        is_active = self.request.query_params.get('is_active', None)
        if is_active is None or is_active.lower() == 'true':
            queryset = queryset.filter(is_active=True)

        return queryset

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        group = self.get_object()

        if group.is_full:
            return Response(
                {"detail": "This group is full."},
                status=status.HTTP_400_BAD_REQUEST
            )

        membership, created = GroupMembership.objects.get_or_create(
            group=group,
            user=request.user,
            defaults={'role': 'member', 'is_active': True}
        )

        if not created:
            if membership.is_active:
                return Response(
                    {"detail": "You are already a member of this group."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            membership.is_active = True
            membership.save()

        serializer = self.get_serializer(group)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        group = self.get_object()

        try:
            membership = GroupMembership.objects.get(
                group=group, user=request.user, is_active=True
            )
        except GroupMembership.DoesNotExist:
            return Response(
                {"detail": "You are not a member of this group."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if membership.role == 'admin' and group.memberships.filter(role='admin', is_active=True).count() == 1:
            return Response(
                {"detail": "Cannot leave group as the only admin. Transfer admin role first or delete the group."},
                status=status.HTTP_400_BAD_REQUEST
            )

        membership.is_active = False
        membership.save()

        serializer = self.get_serializer(group)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'])
    def messages(self, request, pk=None):
        group = self.get_object()

        # Verify user is a member
        if not group.memberships.filter(user=request.user, is_active=True).exists():
            return Response(
                {"detail": "You must be a member to access messages."},
                status=status.HTTP_403_FORBIDDEN
            )

        if request.method == 'GET':
            messages = GroupMessage.objects.filter(group=group).order_by('timestamp')
            serializer = GroupMessageSerializer(messages, many=True, context={'request': request})
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = GroupMessageSerializer(data={**request.data, 'group': group.id}, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
