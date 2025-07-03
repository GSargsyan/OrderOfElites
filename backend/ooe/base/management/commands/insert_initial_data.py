from django.core.management.base import BaseCommand

from ooe.cities.models import City
from ooe.chat.models import ChatRoom

class Command(BaseCommand):
    help = 'Insert initial data into the database.'

    def handle(self, *args, **kwargs):
        # Insert Cities - Ensure city with ID=1 exists first
        # This fixes the login bug where User model expects default city with id=1
        default_city, created = City.objects.get_or_create(
            id=1,
            defaults={'name': 'Abu Dhabi'}
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created default city with ID=1: {default_city.name}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Default city with ID=1 already exists: {default_city.name}'))

        # Insert other cities
        cities = [
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

        for city_name in cities:
            if city_name != default_city.name:  # Skip if already created as default
                City.objects.get_or_create(name=city_name)

        self.stdout.write(self.style.SUCCESS('Successfully inserted: Cities'))

        for city_name in cities:
            city = City.objects.get(name=city_name)
            ChatRoom.objects.get_or_create(name=city.name, city=city, chat_type='city')

        self.stdout.write(self.style.SUCCESS('Successfully inserted: ChatRooms'))
