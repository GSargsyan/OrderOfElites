from django.urls import path
from .views import \
    get_user_houses, \
    buy_house, \
    sell_house

urlpatterns = [
    path('api/items/get_user_houses', get_user_houses),
    path('api/items/buy_house', buy_house),
    path('api/items/sell_house', sell_house),
]
