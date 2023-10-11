from django.urls import path
from .views import \
    signup_user, \
    login_user, \
    is_logged_in

urlpatterns = [
    path('api/signup/', signup_user, name='signup_user'),
    path('api/login/', login_user, name='login_user'),
    path('api/is_logged_in/', is_logged_in, name='is_logged_in'),
]
