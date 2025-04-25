from django.urls import path
from .views import \
    get_user_houses, \
    buy_house, \
    sell_house, \
    get_user_weapons, \
    buy_weapon, \
    sell_weapon, \
    get_user_cars, \
    buy_car, \
    sell_car
    

urlpatterns = [
    path('api/items/get_user_houses', get_user_houses),
    path('api/items/buy_house', buy_house),
    path('api/items/sell_house', sell_house),
    path('api/items/get_user_weapons', get_user_weapons),
    path('api/items/buy_weapon', buy_weapon),
    path('api/items/sell_weapon', sell_weapon),
    path('api/items/get_user_cars', get_user_cars),
    path('api/items/buy_car', buy_car),
    path('api/items/sell_car', sell_car),
]
