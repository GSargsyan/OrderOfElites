from django.db import models
from django.db.models import F
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager


class UserHouse(models.Model):
    user = models.ForeignKey('users.User', related_name='houses', on_delete=models.CASCADE)
    house = models.CharField(max_length=50)
    city = models.ForeignKey('cities.City', related_name='houses', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ooe_users_houses'


class UserCar(models.Model):
    user = models.ForeignKey('users.User', related_name='cars', on_delete=models.CASCADE)
    car = models.CharField(max_length=50)
    city = models.ForeignKey('cities.City', related_name='cars', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ooe_users_cars'


class CarTransaction(models.Model):
    BUY = 'buy'
    SELL = 'sell'
    ACTION_CHOICES = [(BUY, 'Buy'), (SELL, 'Sell')]

    user = models.ForeignKey('users.User', related_name='car_transactions', on_delete=models.CASCADE)
    car = models.CharField(max_length=50)
    city = models.ForeignKey('cities.City', related_name='car_transactions', on_delete=models.CASCADE)
    action = models.CharField(max_length=4, choices=ACTION_CHOICES)
    price = models.BigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ooe_car_transactions'


class UserGun(models.Model):
    user = models.ForeignKey('users.User', related_name='guns', on_delete=models.CASCADE)
    gun = models.CharField(max_length=50)
    city = models.ForeignKey('cities.City', related_name='guns', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ooe_users_guns'


class UserAirplane(models.Model):
    user = models.ForeignKey('users.User', related_name='airplanes', on_delete=models.CASCADE)
    airplane = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ooe_users_airplanes'