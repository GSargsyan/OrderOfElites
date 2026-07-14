from django.urls import path
from .views import \
    get_user_houses, \
    buy_house, \
    sell_house, \
    get_user_guns, \
    buy_gun, \
    sell_gun, \
    get_user_cars, \
    buy_car, \
    sell_car, \
    get_user_airplanes, \
    buy_airplane, \
    sell_airplane
    

urlpatterns = [
    path('api/items/get_user_houses', get_user_houses),
    path('api/items/buy_house', buy_house),
    path('api/items/sell_house', sell_house),
    path('api/items/get_user_guns', get_user_guns),
    path('api/items/buy_gun', buy_gun),
    path('api/items/sell_gun', sell_gun),
    path('api/items/get_user_cars', get_user_cars),
    path('api/items/buy_car', buy_car),
    path('api/items/sell_car', sell_car),
    path('api/items/get_user_airplanes', get_user_airplanes),
    path('api/items/buy_airplane', buy_airplane),
    path('api/items/sell_airplane', sell_airplane),
]
