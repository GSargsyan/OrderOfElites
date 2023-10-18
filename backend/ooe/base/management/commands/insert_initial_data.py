from django.core.management.base import BaseCommand

from ooe.cities.models import City

class Command(BaseCommand):
    help = 'Insert initial data into the database.'

    def handle(self, *args, **kwargs):
        # Insert Cities
        cities = [
            'Abu Dhabi',
            'Hong Kong',
            'Jakarta',
            'London',
            'Mexico City',
            'Moscow',
            'New York',
            'Paris',
            'Rio de Janeiro',
            'Rome',
            'Sydney',
            'Tokyo',
        ]

        for city in cities:
            City.objects.get_or_create(name=city)

        self.stdout.write(self.style.SUCCESS('Successfully inserted initial data'))