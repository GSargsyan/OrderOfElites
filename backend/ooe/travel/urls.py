from django.urls import path
from .views import get_travel_tab_data, initiate_travel

urlpatterns = [
    path('api/travel/get_travel_tab_data', get_travel_tab_data),
    path('api/travel/initiate_travel', initiate_travel),
]
