from django.urls import path
from .views import \
    signup_user, \
    login_user, \
    get_preview

urlpatterns = [
    path('api/users/signup', signup_user, name='signup_user'),
    path('api/users/login', login_user, name='login_user'),
    path('api/users/get_preview', get_preview, name='get_preview'),
]
