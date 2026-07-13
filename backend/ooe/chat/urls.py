from django.urls import path
from .views import \
    get_user_rooms, \
    authenticate_connection, \
    get_dm_conversations, \
    get_dm_messages, \
    send_dm, \
    get_city_messages, \
    send_city_message, \
    mark_messages_read

urlpatterns = [
    path('api/chat/get_user_rooms', get_user_rooms, name='get_user_rooms'),
    path('api/chat/authenticate_connection', authenticate_connection, name='authenticate_connection'),
    path('api/chat/get_dm_conversations', get_dm_conversations, name='get_dm_conversations'),
    path('api/chat/get_dm_messages', get_dm_messages, name='get_dm_messages'),
    path('api/chat/send_dm', send_dm, name='send_dm'),
    path('api/chat/get_city_messages', get_city_messages, name='get_city_messages'),
    path('api/chat/send_city_message', send_city_message, name='send_city_message'),
    path('api/chat/mark_messages_read', mark_messages_read, name='mark_messages_read'),
]