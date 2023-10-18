from django.db import models


class City(models.Model):
    name = models.CharField(max_length=30)


class CityRoutes(models.Model):
    original_city_id = models.ForeignKey('City', on_delete = models.CASCADE)
    destination_city_id = models.ForeignKey('City', on_delete = models.CASCADE)
    travel_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    travel_time_minutes = models.IntegerField()