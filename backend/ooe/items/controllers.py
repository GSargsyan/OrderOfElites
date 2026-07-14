import time
import random

from django.core.cache import cache
from django.db.models import F

from ooe.users.models import User
from ooe.base.exceptions import OOEException
from ooe.items.constants import \
    HOUSES, \
    HOUSE_SELL_PERCENT, \
    AIRPLANES, \
    AIRPLANE_SELL_PERCENT


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

    @staticmethod
    def get_user_airplanes(user: object):
        user_airplanes = user.airplanes.all()
        owned_airplanes = {ap.airplane for ap in user_airplanes}

        return {
            key: {
                'name': airplane['name'],
                'price': airplane['price'],
                'speed_multiplier': airplane['speed_multiplier'],
                'price_multiplier': airplane['price_multiplier'],
                'cooldown': airplane['cooldown'],
                'cooldown_minutes': airplane['cooldown_minutes'],
                'owned': key in owned_airplanes or key == 'commercial_flight',
            }
            for key, airplane in AIRPLANES.items()
        }

    @staticmethod
    def buy_airplane(user: object, airplane_name: str):
        if airplane_name not in AIRPLANES:
            raise OOEException('Invalid airplane name')

        if airplane_name == 'commercial_flight':
            raise OOEException('Cannot buy commercial flight')

        if user.money_cash < AIRPLANES[airplane_name]['price']:
            raise OOEException('Not enough money')

        if user.airplanes.filter(airplane=airplane_name).exists():
            raise OOEException('Already owns this airplane')

        user.money_cash = F('money_cash') - AIRPLANES[airplane_name]['price']
        user.save()

        user.airplanes.create(
            airplane=airplane_name,
        )

        return {
            'status': 'success',
            'message': 'Airplane bought',
        }

    @staticmethod
    def sell_airplane(user: object, airplane_name: str):
        if airplane_name not in AIRPLANES:
            raise OOEException('Invalid airplane name')

        if airplane_name == 'commercial_flight':
            raise OOEException('Cannot sell commercial flight')

        if not user.airplanes.filter(airplane=airplane_name).exists():
            raise OOEException('Does not own this airplane')

        user.money_cash = F('money_cash') + AIRPLANES[airplane_name]['price'] * AIRPLANE_SELL_PERCENT
        user.save()

        user.airplanes.filter(airplane=airplane_name).delete()

        return {
            'status': 'success',
            'message': 'Airplane sold',
        }