from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from .models import HousingListing, HousingImage, HousingInquiry
from .serializers import HousingListingSerializer, HousingImageSerializer, HousingInquirySerializer


class HousingListingViewSet(viewsets.ModelViewSet):
    queryset = HousingListing.objects.all().order_by('-posted_date')
    serializer_class = HousingListingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'address', 'city']
    ordering_fields = ['rent_price', 'posted_date', 'distance_to_campus', 'bedrooms']

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by housing type
        housing_type = self.request.query_params.get('housing_type', None)
        if housing_type:
            queryset = queryset.filter(housing_type=housing_type)

        # Filter by price range
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        if min_price:
            queryset = queryset.filter(rent_price__gte=min_price)
        if max_price:
            queryset = queryset.filter(rent_price__lte=max_price)

        # Filter by bedrooms
        bedrooms = self.request.query_params.get('bedrooms', None)
        if bedrooms:
            queryset = queryset.filter(bedrooms__gte=bedrooms)

        # Filter by bathrooms
        bathrooms = self.request.query_params.get('bathrooms', None)
        if bathrooms:
            queryset = queryset.filter(bathrooms__gte=bathrooms)

        # Filter by distance to campus
        max_distance = self.request.query_params.get('max_distance', None)
        if max_distance:
            queryset = queryset.filter(distance_to_campus__lte=max_distance)

        # Boolean filters
        for field in ['furnished', 'pets_allowed', 'parking', 'laundry', 'wifi_included', 'ac', 'utilities_included']:
            value = self.request.query_params.get(field, None)
            if value is not None and value.lower() == 'true':
                queryset = queryset.filter(**{field: True})

        # Filter by availability
        is_available = self.request.query_params.get('is_available', None)
        if is_available is not None:
            queryset = queryset.filter(is_available=is_available.lower() == 'true')

        # Filter by user's listings
        if self.request.query_params.get('my_listings', None):
            queryset = queryset.filter(posted_by=self.request.user)

        return queryset

    def perform_create(self, serializer):
        listing = serializer.save()
        # Handle image uploads
        images = self.request.FILES.getlist('images')
        for image in images:
            HousingImage.objects.create(listing=listing, image=image)

    @action(detail=True, methods=['post'])
    def mark_unavailable(self, request, pk=None):
        listing = self.get_object()
        if listing.posted_by != request.user:
            return Response(
                {"detail": "You don't have permission to update this listing."},
                status=status.HTTP_403_FORBIDDEN
            )
        listing.is_available = False
        listing.save()
        return Response({"status": "Listing marked as unavailable"})

    @action(detail=True, methods=['post'])
    def mark_available(self, request, pk=None):
        listing = self.get_object()
        if listing.posted_by != request.user:
            return Response(
                {"detail": "You don't have permission to update this listing."},
                status=status.HTTP_403_FORBIDDEN
            )
        listing.is_available = True
        listing.save()
        return Response({"status": "Listing marked as available"})


class HousingInquiryViewSet(viewsets.ModelViewSet):
    queryset = HousingInquiry.objects.all().order_by('-timestamp')
    serializer_class = HousingInquirySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return HousingInquiry.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).order_by('-timestamp')

    @action(detail=False, methods=['get'])
    def by_listing(self, request):
        listing_id = request.query_params.get('listing_id', None)
        other_user_id = request.query_params.get('other_user_id', None)

        if not listing_id or not other_user_id:
            return Response(
                {"detail": "Both listing_id and other_user_id are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        inquiries = HousingInquiry.objects.filter(
            Q(listing_id=listing_id) & (
                Q(sender=request.user, receiver_id=other_user_id) |
                Q(sender_id=other_user_id, receiver=request.user)
            )
        ).order_by('timestamp')

        # Mark as read
        unread = inquiries.filter(receiver=request.user, is_read=False)
        unread.update(is_read=True)

        serializer = self.get_serializer(inquiries, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = HousingInquiry.objects.filter(
            receiver=request.user, is_read=False
        ).count()
        return Response({'count': count})

    @action(detail=False, methods=['get'])
    def conversations(self, request):
        user = request.user
        inquiries = HousingInquiry.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).select_related('listing', 'sender', 'receiver').order_by('-timestamp')

        seen = set()
        conversations = []
        for inq in inquiries:
            other_user = inq.receiver if inq.sender == user else inq.sender
            key = (inq.listing_id, other_user.id)
            if key in seen:
                continue
            seen.add(key)
            unread = HousingInquiry.objects.filter(
                listing_id=inq.listing_id, sender=other_user, receiver=user, is_read=False
            ).count()
            conversations.append({
                'type': 'housing',
                'listing_id': inq.listing_id,
                'listing_title': inq.listing.title,
                'other_user_id': other_user.id,
                'other_username': other_user.username,
                'last_message': inq.message,
                'timestamp': inq.timestamp,
                'unread_count': unread,
            })

        return Response(conversations)
