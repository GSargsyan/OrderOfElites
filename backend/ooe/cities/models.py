from django.db import models


class City(models.Model):
    name = models.CharField(max_length=30)

    class Meta:
        db_table = 'ooe_cities'


class CityRoute(models.Model):
    original_city = models.ForeignKey('City', on_delete = models.CASCADE, related_name='origin_city')
    destination_city = models.ForeignKey('City', on_delete = models.CASCADE, related_name='destination_city')
    travel_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    travel_time_minutes = models.IntegerField()

    class Meta:
        db_table = 'ooe_city_routes'