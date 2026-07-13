from django.db import models
from django.db.models import Max, Q, Subquery, OuterRef
from django.utils import timezone


class ChatRoom(models.Model):
    TYPE_CHOICES = [
        ('direct', 'Direct Message'),
        ('group', 'Group Chat'),
        ('city', 'City Chat'),
        ('syndicate', 'Syndicate Chat'),
    ]

    name = models.CharField(max_length=30)
    creator_user = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True)
    chat_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    city = models.ForeignKey('cities.City', related_name='chat_rooms', on_delete=models.CASCADE, null=True)
    users = models.ManyToManyField('users.User', related_name='chat_rooms')
    # auto_created = models.BooleanField(null=False)
    # syndicate = models.ForeignKey('cities.City', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ooe_chat_rooms'

    @staticmethod
    def get_or_create_dm_room(user1, user2):
        """Find or create a DM room between two users."""
        # Find existing DM room that contains both users
        common_rooms = ChatRoom.objects.filter(
            chat_type='direct',
            users=user1
        ).filter(
            users=user2
        )

        if common_rooms.exists():
            return common_rooms.first()

        # Create a new DM room
        room = ChatRoom.objects.create(
            name=f'DM',
            chat_type='direct',
            creator_user=user1,
        )
        room.users.add(user1, user2)
        return room

    @staticmethod
    def get_dm_conversations(user):
        """
        Return serialized list of DM conversations for a user,
        sorted by most recent message, with last message preview and unread count.
        """
        dm_rooms = ChatRoom.objects.filter(
            chat_type='direct',
            users=user
        ).annotate(
            last_message_time=Max('messages__created_at')
        ).order_by('-last_message_time')

        conversations = []
        for room in dm_rooms:
            # Get the other user in the DM
            other_user = room.users.exclude(id=user.id).first()
            if not other_user:
                continue

            # Get the last message
            last_msg = room.messages.order_by('-created_at').first()
            if not last_msg:
                continue

            # Count unread messages (messages from the other user that haven't been read)
            unread_count = room.messages.filter(
                user=other_user,
                read_at__isnull=True
            ).count()

            conversations.append({
                'room_id': room.id,
                'username': other_user.username,
                'last_message': last_msg.message[:80],
                'last_message_time': last_msg.created_at.isoformat(),
                'is_mine': last_msg.user_id == user.id,
                'unread_count': unread_count,
            })

        return conversations


class Message(models.Model):
    chat_room = models.ForeignKey('chat.ChatRoom', related_name='messages', on_delete=models.CASCADE)
    user = models.ForeignKey('users.User', related_name='messages', on_delete=models.CASCADE)
    message = models.TextField()
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ooe_messages'

    @staticmethod
    def get_dm_messages(user1, user2, before_id=None, limit=50):
        """
        Get paginated DM messages between two users.
        Uses cursor-based pagination (before_id) for scroll-up loading.
        """
        common_rooms = ChatRoom.objects.filter(
            chat_type='direct',
            users=user1
        ).filter(
            users=user2
        )

        qs = Message.objects.filter(
            chat_room__in=common_rooms
        ).select_related('user').order_by('-created_at')

        if before_id:
            qs = qs.filter(id__lt=before_id)

        messages = list(qs[:limit])
        messages.reverse()  # Return in chronological order

        return [{
            'id': msg.id,
            'username': msg.user.username,
            'message': msg.message,
            'is_mine': msg.user_id == user1.id,
            'created_at': msg.created_at.isoformat(),
        } for msg in messages]

    @staticmethod
    def get_city_messages(city_room_id, before_id=None, limit=50):
        """
        Get paginated messages for a city chat room.
        """
        qs = Message.objects.filter(
            chat_room_id=city_room_id
        ).select_related('user').order_by('-created_at')

        if before_id:
            qs = qs.filter(id__lt=before_id)

        messages = list(qs[:limit])
        messages.reverse()  # Return in chronological order

        return [{
            'id': msg.id,
            'username': msg.user.username,
            'message': msg.message,
            'created_at': msg.created_at.isoformat(),
        } for msg in messages]