from django.urls import path
from .views import get_user_connections

urlpatterns = [
    path('api/chat/get_user_connections', get_user_connections, name='get_user_connections'),
]
