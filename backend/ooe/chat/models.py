from django.db import models


class ChatRoom(models.Model):
    name = models.CharField(max_length=30)
    creator_user = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True)
    city = models.ForeignKey('cities.City', on_delete=models.CASCADE, null=True)
    # auto_created = models.BooleanField(null=False)
    # syndicate = models.ForeignKey('cities.City', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ooe_chat_rooms'


class ChatConnection(models.Model):
    user = models.ForeignKey('users.User', related_name='chat_connections', on_delete=models.CASCADE)
    chat_room = models.ForeignKey('ChatRoom', related_name='chat_connections', on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ooe_chat_connections'


class Conversation(models.Model):
    user = models.ForeignKey('users.User', related_name='conversations', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_conversations(self, user):
        conversations = []
        for conversation in user.conversations.all():
            last_message = conversation.messages.last()
            conversations.append({
                'username': conversation.user.username,
                'last_message': last_message.message if last_message else '',
                'created_at': conversation.created_at
            })

        return conversations

    class Meta:
        db_table = 'ooe_conversations'


class Message(models.Model):
    conversation = models.ForeignKey('Conversation', related_name='messages', on_delete=models.CASCADE)
    user = models.ForeignKey('users.User', related_name='messages', on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ooe_messages'