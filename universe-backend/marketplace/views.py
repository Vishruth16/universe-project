# marketplace/views.py
from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from .models import MarketplaceItem, ItemImage, MarketplaceMessage
from .serializers import MarketplaceItemSerializer, ItemImageSerializer, MarketplaceMessageSerializer

class MarketplaceItemViewSet(viewsets.ModelViewSet):
    queryset = MarketplaceItem.objects.all().order_by('-posted_date')
    serializer_class = MarketplaceItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'item_type']
    ordering_fields = ['price', 'posted_date']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by item type
        item_type = self.request.query_params.get('item_type', None)
        if item_type:
            queryset = queryset.filter(item_type=item_type)
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        # Filter by sold status
        is_sold = self.request.query_params.get('is_sold', None)
        if is_sold is not None:
            is_sold = is_sold.lower() == 'true'
            queryset = queryset.filter(is_sold=is_sold)
        
        # Filter by user's items
        if self.request.query_params.get('my_items', None):
            queryset = queryset.filter(seller=self.request.user)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def mark_as_sold(self, request, pk=None):
        item = self.get_object()
        
        # Check if the user is the seller
        if item.seller != request.user:
            return Response(
                {"detail": "You don't have permission to mark this item as sold."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        item.is_sold = True
        item.save()

        return Response({"status": "Item marked as sold"})

    @action(detail=True, methods=['post'])
    def mark_as_available(self, request, pk=None):
        item = self.get_object()
        if item.seller != request.user:
            return Response(
                {"detail": "You don't have permission to update this item."},
                status=status.HTTP_403_FORBIDDEN
            )
        item.is_sold = False
        item.save()
        return Response({"status": "Item marked as available"})

class MarketplaceMessageViewSet(viewsets.ModelViewSet):
    queryset = MarketplaceMessage.objects.all().order_by('-timestamp')
    serializer_class = MarketplaceMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return MarketplaceMessage.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).order_by('-timestamp')
    
    @action(detail=False, methods=['get'])
    def by_item(self, request):
        item_id = request.query_params.get('item_id', None)
        other_user_id = request.query_params.get('other_user_id', None)
        
        if not item_id or not other_user_id:
            return Response(
                {"detail": "Both item_id and other_user_id are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        messages = MarketplaceMessage.objects.filter(
            Q(item_id=item_id) & (
                Q(sender=request.user, receiver_id=other_user_id) | 
                Q(sender_id=other_user_id, receiver=request.user)
            )
        ).order_by('timestamp')

        # Mark messages as read
        unread_messages = messages.filter(receiver=request.user, is_read=False)
        for message in unread_messages:
            message.is_read = True
            message.save()
        
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = MarketplaceMessage.objects.filter(
            receiver=request.user, is_read=False
        ).count()
        return Response({'count': count})

    @action(detail=False, methods=['get'])
    def conversations(self, request):
        user = request.user
        messages = MarketplaceMessage.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).select_related('item', 'sender', 'receiver').order_by('-timestamp')

        seen = set()
        conversations = []
        for msg in messages:
            other_user = msg.receiver if msg.sender == user else msg.sender
            key = (msg.item_id, other_user.id)
            if key in seen:
                continue
            seen.add(key)
            unread = MarketplaceMessage.objects.filter(
                item_id=msg.item_id, sender=other_user, receiver=user, is_read=False
            ).count()
            conversations.append({
                'type': 'marketplace',
                'item_id': msg.item_id,
                'item_title': msg.item.title,
                'other_user_id': other_user.id,
                'other_username': other_user.username,
                'last_message': msg.content,
                'timestamp': msg.timestamp,
                'unread_count': unread,
            })

        return Response(conversations)