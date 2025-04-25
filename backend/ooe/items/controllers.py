import time
import random

from django.core.cache import cache
from django.db.models import F

from ooe.users.models import User
from ooe.base.exceptions import OOEException
from ooe.items.constants import \
    HOUSES, \
    HOUSE_SELL_PERCENT


class ItemsController:
    def __init__(self):
        pass

    @staticmethod
    def get_user_houses(user: object):
        user_houses = user.houses.all()
        # build a dict of house: [list of cities owned in]
        # then add the dict in owned_in_cities
        owns_in_cities = {house: [] for house in HOUSES}

        for house in user_houses:
            owns_in_cities[house.house].append(house.city.name)

        return {
            key: {
                'name': house['name'],
                # user current city here
                'price': house['price'],
                'defense_multiplier': house['defense_multiplier'],
                'maintenance_cost': house['maintenance_cost'],
                'owns_in_cities': owns_in_cities[key],
                'owns_in_current_city': user.city.name in owns_in_cities[key],
            }
            for key, house in HOUSES.items()
        }

    @staticmethod
    def buy_house(user: object, house_name: str):
        if house_name not in HOUSES:
            raise OOEException('Invalid house name')

        if user.money_cash < HOUSES[house_name]['price']:
            raise OOEException('Not enough money')

        if user.houses.filter(city=user.city).exists():
            raise OOEException('Already owns a house in the current city')

        user.money_cash = F('money_cash') - HOUSES[house_name]['price']
        user.save()

        user.houses.create(
            house=house_name,
            city=user.city,
        )

        return {
            'status': 'success',
            'message': 'House bought',
        }

    @staticmethod
    def sell_house(user: object, house_name: str):
        if house_name not in HOUSES:
            raise OOEException('Invalid house name')

        if not user.houses.filter(house=house_name, city=user.city).exists():
            raise OOEException('Does not own this house in the current city')

        user.money_cash = F('money_cash') + HOUSES[house_name]['price'] * HOUSE_SELL_PERCENT
        user.save()

        user.houses.filter(house=house_name, city=user.city).delete()

        return {
            'status': 'success',
            'message': 'House sold',
        }