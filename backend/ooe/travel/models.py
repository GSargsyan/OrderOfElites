from django.db import models


class FlightLog(models.Model):
    """
    Tracks all flights, active and historical.

    Active flight:    arrived_at IS NULL
    Completed flight: arrived_at IS NOT NULL

    cooldown_until is set when the flight completes, based on the airplane used.
    """
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='flights',
    )
    airplane = models.CharField(max_length=50)  # e.g. 'corvus', 'commercial_flight'
    origin_city = models.ForeignKey(
        'cities.City',
        on_delete=models.CASCADE,
        related_name='departures',
    )
    destination_city = models.ForeignKey(
        'cities.City',
        on_delete=models.CASCADE,
        related_name='arrivals',
    )
    cost = models.IntegerField()
    departed_at = models.DateTimeField()
    arrival_time = models.DateTimeField()       # when the Celery task fires / player arrives
    arrived_at = models.DateTimeField(null=True, blank=True)  # set when completed
    cooldown_until = models.DateTimeField(null=True, blank=True)  # post-flight cooldown end

    class Meta:
        db_table = 'ooe_flight_log'
        ordering = ['-departed_at']
