from django.urls import path
from .views import \
    signup_user, \
    login_user

urlpatterns = [
    path('api/signup/', signup_user, name='signup_user'),
    path('api/login/', login_user, name='login_user'),
]
