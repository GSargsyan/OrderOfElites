from django.urls import path
from .views import \
    get_user_rooms, \
    authenticate_connection, \
    get_dm_conversations, \
    get_dm_messages

urlpatterns = [
    path('api/chat/get_user_rooms', get_user_rooms, name='get_user_rooms'),
    path('api/chat/authenticate_connection', authenticate_connection, name='authenticate_connection'),
    path('api/chat/get_dm_conversations', get_dm_conversations, name='get_dm_conversations'),
    path('api/chat/get_dm_messages', get_dm_messages, name='get_dm_messages'),
]