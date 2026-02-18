import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Notification

logger = logging.getLogger(__name__)


def _get_unread_counts(user):
    """Return fresh unread message counts from the DB for a given user."""
    from marketplace.models import MarketplaceMessage
    from housing.models import HousingInquiry
    from roommate_matching.models import RoommateMessage

    return {
        'marketplace': MarketplaceMessage.objects.filter(receiver=user, is_read=False).count(),
        'housing': HousingInquiry.objects.filter(receiver=user, is_read=False).count(),
        'roommate': RoommateMessage.objects.filter(
            is_read=False,
        ).exclude(sender=user).filter(
            match_request__sender=user,
        ).count() + RoommateMessage.objects.filter(
            is_read=False,
        ).exclude(sender=user).filter(
            match_request__receiver=user,
        ).count(),
    }


def send_ws_event(user_id, event_type, data):
    """Send a WebSocket event to the user's channel group."""
    try:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return
        async_to_sync(channel_layer.group_send)(
            f'user_{user_id}',
            {'type': event_type, 'data': data},
        )
    except Exception:
        logger.exception('Failed to send WS event %s to user %s', event_type, user_id)


def _send_unread_update(user):
    """Push fresh unread counts to a user over WebSocket."""
    counts = _get_unread_counts(user)
    send_ws_event(user.id, 'unread_update', counts)


# ---------------------------------------------------------------------------
# Match Request signals
# ---------------------------------------------------------------------------

@receiver(post_save, sender='roommate_matching.MatchRequest')
def match_request_notification(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            recipient=instance.receiver,
            sender=instance.sender,
            notification_type='match_request',
            title=f'{instance.sender.username} sent you a roommate request',
            message=instance.message or '',
            link=f'/roommate-matching/{instance.sender.id}',
            related_id=instance.id,
        )
        send_ws_event(instance.receiver.id, 'notification', {
            'notification_type': 'match_request',
            'title': f'{instance.sender.username} sent you a roommate request',
            'sender_username': instance.sender.username,
            'related_id': instance.id,
            'link': f'/roommate-matching/{instance.sender.id}',
        })
    else:
        if instance.status == 'accepted':
            Notification.objects.create(
                recipient=instance.sender,
                sender=instance.receiver,
                notification_type='match_accepted',
                title=f'{instance.receiver.username} accepted your roommate request',
                link=f'/roommate-matching/{instance.receiver.id}',
                related_id=instance.id,
            )
            send_ws_event(instance.sender.id, 'notification', {
                'notification_type': 'match_accepted',
                'title': f'{instance.receiver.username} accepted your roommate request',
                'sender_username': instance.receiver.username,
                'related_id': instance.id,
                'link': f'/roommate-matching/{instance.receiver.id}',
            })
        elif instance.status == 'rejected':
            Notification.objects.create(
                recipient=instance.sender,
                sender=instance.receiver,
                notification_type='match_rejected',
                title=f'{instance.receiver.username} declined your roommate request',
                link=f'/roommate-matching/{instance.receiver.id}',
                related_id=instance.id,
            )
            send_ws_event(instance.sender.id, 'notification', {
                'notification_type': 'match_rejected',
                'title': f'{instance.receiver.username} declined your roommate request',
                'sender_username': instance.receiver.username,
                'related_id': instance.id,
                'link': f'/roommate-matching/{instance.receiver.id}',
            })


# ---------------------------------------------------------------------------
# Roommate Message signals
# ---------------------------------------------------------------------------

@receiver(post_save, sender='roommate_matching.RoommateMessage')
def roommate_message_notification(sender, instance, created, **kwargs):
    if created:
        match_req = instance.match_request
        recipient = match_req.receiver if instance.sender == match_req.sender else match_req.sender
        Notification.objects.create(
            recipient=recipient,
            sender=instance.sender,
            notification_type='roommate_message',
            title=f'{instance.sender.username} sent you a message',
            message=instance.content[:100] if instance.content else '',
            link=f'/roommate-matching/{instance.sender.id}',
            related_id=instance.id,
        )
        send_ws_event(recipient.id, 'new_message', {
            'id': instance.id,
            'conversation_type': 'roommate',
            'match_request_id': match_req.id,
            'sender': instance.sender.id,
            'sender_username': instance.sender.username,
            'content': instance.content,
            'timestamp': instance.timestamp.isoformat() if instance.timestamp else '',
        })
        _send_unread_update(recipient)


# ---------------------------------------------------------------------------
# Marketplace Message signals
# ---------------------------------------------------------------------------

@receiver(post_save, sender='marketplace.MarketplaceMessage')
def marketplace_message_notification(sender, instance, created, **kwargs):
    if created:
        item_title = instance.item.title if instance.item else 'an item'
        Notification.objects.create(
            recipient=instance.receiver,
            sender=instance.sender,
            notification_type='marketplace_message',
            title=f'{instance.sender.username} messaged you about {item_title}',
            message=instance.content[:100] if instance.content else '',
            link=f'/marketplace/{instance.item_id}',
            related_id=instance.id,
        )
        send_ws_event(instance.receiver.id, 'new_message', {
            'id': instance.id,
            'conversation_type': 'marketplace',
            'item_id': instance.item_id,
            'sender': instance.sender.id,
            'sender_username': instance.sender.username,
            'content': instance.content,
            'timestamp': instance.timestamp.isoformat() if instance.timestamp else '',
        })
        _send_unread_update(instance.receiver)


# ---------------------------------------------------------------------------
# Housing Inquiry signals
# ---------------------------------------------------------------------------

@receiver(post_save, sender='housing.HousingInquiry')
def housing_inquiry_notification(sender, instance, created, **kwargs):
    if created:
        listing_title = instance.listing.title if instance.listing else 'a listing'
        Notification.objects.create(
            recipient=instance.receiver,
            sender=instance.sender,
            notification_type='housing_inquiry',
            title=f'{instance.sender.username} inquired about {listing_title}',
            message=instance.message[:100] if instance.message else '',
            link=f'/housing/{instance.listing_id}',
            related_id=instance.id,
        )
        send_ws_event(instance.receiver.id, 'new_message', {
            'id': instance.id,
            'conversation_type': 'housing',
            'listing_id': instance.listing_id,
            'sender': instance.sender.id,
            'sender_username': instance.sender.username,
            'content': instance.message,
            'timestamp': instance.timestamp.isoformat() if instance.timestamp else '',
        })
        _send_unread_update(instance.receiver)


# ---------------------------------------------------------------------------
# Group Message signals
# ---------------------------------------------------------------------------

@receiver(post_save, sender='study_groups.GroupMessage')
def group_message_notification(sender, instance, created, **kwargs):
    if created:
        group = instance.group
        active_members = group.memberships.filter(is_active=True).exclude(user=instance.sender)
        notifications = [
            Notification(
                recipient=membership.user,
                sender=instance.sender,
                notification_type='group_message',
                title=f'New message in {group.name}',
                message=instance.content[:100] if instance.content else '',
                link=f'/study-groups/{group.id}',
                related_id=instance.id,
            )
            for membership in active_members
        ]
        if notifications:
            Notification.objects.bulk_create(notifications)

        # Send WebSocket event to each member except sender
        message_data = {
            'id': instance.id,
            'conversation_type': 'study_group',
            'group_id': group.id,
            'sender': instance.sender.id,
            'sender_username': instance.sender.username,
            'content': instance.content,
            'timestamp': instance.timestamp.isoformat() if instance.timestamp else '',
        }
        for membership in active_members:
            send_ws_event(membership.user.id, 'new_message', message_data)
