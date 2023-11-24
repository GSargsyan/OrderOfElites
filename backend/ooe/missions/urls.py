from django.urls import path
from .views import \
    get_missions_tab_data, \
    start_mission

urlpatterns = [
    path('api/missions/get_missions_tab_data', get_missions_tab_data, name='get_missions_tab_data'),
    path('api/missions/start/<str:mission_name>', start_mission, name='start_mission'),
]
