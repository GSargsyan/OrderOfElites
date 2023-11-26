from django.urls import path
from .views import \
    get_user_connections, \
    authenticate_connection, \
    get_conversations

urlpatterns = [
    path('api/chat/get_user_connections', get_user_connections, name='get_user_connections'),
    path('api/chat/authenticate_connection', authenticate_connection, name='authenticate_connection'),
    path('api/chat/get_conversations', get_conversations, name='get_conversations'),
]