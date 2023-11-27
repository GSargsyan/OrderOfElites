from django.urls import path
from .views import \
    signup_user, \
    login_user, \
    get_preview, \
    get_skills_tab_data, \
    start_skill_practice, \
    find_by_username

urlpatterns = [
    path('api/users/signup', signup_user, name='signup_user'),
    path('api/users/login', login_user, name='login_user'),
    path('api/users/get_preview', get_preview, name='get_preview'),
    path('api/users/get_skills_tab_data', get_skills_tab_data, name='get_skills_tab_data'),
    path('api/users/start_skill_practice/<str:skill_name>', start_skill_practice, name='start_skill_practice'),
    path('api/users/find_by_username', find_by_username, name='find_by_username'),
]
