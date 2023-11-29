from django.db import models
from django.db.models import Prefetch, Max, F


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

    @staticmethod
    def get_dm_conversations(user: object):
        dm_rooms = ChatRoom.objects.filter(chat_type='direct', users=user)

        # Annotate each ChatRoom with the ID of the last message
        last_message_ids = Message.objects.filter(
            chat_room__in=dm_rooms
        ).values('chat_room_id').annotate(
            last_message_id=Max('id')
        )

        # Prepare a Prefetch query for the last message in each ChatRoom
        last_messages = Prefetch(
            'messages',
            queryset=Message.objects.filter(
                id__in=last_message_ids.values('last_message_id')
            ),
            to_attr='last_message'
        )

        return dm_rooms.prefetch_related(last_messages)

    class Meta:
        db_table = 'ooe_chat_rooms'


class Message(models.Model):
    chat_room = models.ForeignKey('chat.ChatRoom', related_name='messages', on_delete=models.CASCADE)
    user = models.ForeignKey('users.User', related_name='messages', on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ooe_messages'


    def get_dm_messages(user_1, user_2):
        dm_rooms = ChatRoom.objects.filter(chat_type='direct', users=user_1)
        dm_rooms = dm_rooms.filter(chat_type='direct', users=user_2)

        return dm_rooms.prefetch_related(last_messages)

    @staticmethod
    def get_dm_messages(user1, user2):
        common_chat_rooms = ChatRoom.objects.filter(
            chat_type='direct',
            users=user1
        ).filter(
            users=user2
        )

        messages = Message.objects.filter(
            chat_room__in=common_chat_rooms
        ).order_by('created_at')

        return messages