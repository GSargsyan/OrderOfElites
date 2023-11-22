from django.urls import path
from .views import \
    get_user_connections, \
    authenticate_connection

urlpatterns = [
    path('api/chat/get_user_connections', get_user_connections, name='get_user_connections'),
    path('api/chat/authenticate_connection', authenticate_connection, name='authenticate_connection'),
]