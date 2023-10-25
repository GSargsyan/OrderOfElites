from django.db import models


class ChatGroup(models.Model):
    name = models.CharField(max_length=30)
    creator_user = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True)
    city = models.ForeignKey('cities.City', on_delete=models.CASCADE, null=True)
    # auto_created = models.BooleanField(null=False)
    # syndicate = models.ForeignKey('cities.City', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ooe_chat_groups'


class ChatConnection(models.Model):
    user = models.ForeignKey('users.User', related_name='chat_connections', on_delete=models.CASCADE)
    chat_group = models.ForeignKey('ChatGroup', related_name='chat_connections', on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ooe_chat_connections'