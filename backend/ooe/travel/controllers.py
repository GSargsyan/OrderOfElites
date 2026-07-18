import math
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from ooe.base.exceptions import OOEException
from ooe.base.constants import TRAVEL_ROUTES, TRAVEL_TIME_REDUCER
from ooe.items.constants import AIRPLANES
from ooe.cities.models import City
from ooe.chat.models import ChatRoom
from ooe.travel.models import FlightLog


class TravelController:

    @staticmethod
    def check_and_complete_active_flight(user):
        """
        Checks if the user has an active flight whose arrival time has passed.
        If so, completes it.
        """
        from ooe.travel.models import FlightLog
        active_flight = FlightLog.objects.filter(
            user=user,
            arrived_at__isnull=True,
            arrival_time__lte=timezone.now()
        ).first()
        if active_flight:
            TravelController.complete_flight(active_flight.id)
            user.refresh_from_db()

    @staticmethod
    def get_travel_tab_data(user):
        """
        Returns everything the Travel tab needs to render:
          - cities: list of all cities (excluding current city)
          - routes: nested dict of route data from current city
          - airplanes: list of airplanes the user owns (+ commercial_flight always available)
          - active_flight: serialized active FlightLog or None
          - cooldown_until: epoch timestamp of cooldown end (or 0)
        """
        from ooe.travel.models import FlightLog

        # Check and complete flight if user has already arrived
        TravelController.check_and_complete_active_flight(user)

        current_city_name = user.city.name

        # Build available routes from current city
        routes = TRAVEL_ROUTES.get(current_city_name, {})

        # Cities list (all cities in the routes dict, excludes current city)
        destination_cities = list(routes.keys())

        # Airplanes the user can use
        user_airplane_keys = set(
            a.airplane for a in user.airplanes.all()
        )
        # commercial_flight is always available
        available_airplanes = []
        for key, airplane in AIRPLANES.items():
            if key == 'commercial_flight' or key in user_airplane_keys:
                available_airplanes.append({
                    'key': key,
                    'name': airplane['name'],
                    'speed_multiplier': airplane['speed_multiplier'],
                    'price_multiplier': airplane['price_multiplier'],
                    'cooldown': airplane['cooldown'],
                    'cooldown_minutes': airplane['cooldown_minutes'],
                })

        # Active flight
        active_flight = FlightLog.objects.filter(
            user=user,
            arrived_at__isnull=True
        ).select_related('origin_city', 'destination_city').first()

        active_flight_data = None
        if active_flight:
            active_flight_data = {
                'id': active_flight.id,
                'airplane': active_flight.airplane,
                'origin_city': active_flight.origin_city.name,
                'destination_city': active_flight.destination_city.name,
                'departed_at': active_flight.departed_at.isoformat(),
                'arrival_time': active_flight.arrival_time.timestamp(),
                'cost': active_flight.cost,
            }

        # Cooldown remaining (from most recent completed flight)
        latest_flight = FlightLog.objects.filter(
            user=user,
            arrived_at__isnull=False,
            ).order_by('-arrived_at').first()

        cooldown_until_ts = 0
        if latest_flight and latest_flight.cooldown_until:
            now = timezone.now()
            if latest_flight.cooldown_until > now:
                cooldown_until_ts = latest_flight.cooldown_until.timestamp()

        return {
            'current_city': current_city_name,
            'destination_cities': destination_cities,
            'routes': routes,
            'available_airplanes': available_airplanes,
            'active_flight': active_flight_data,
            'cooldown_until': cooldown_until_ts,
        }

    @staticmethod
    @transaction.atomic
    def initiate_travel(user, destination_city_name: str, airplane_key: str):
        """
        Validates and starts a flight.
        Deducts cost, creates FlightLog, schedules Celery arrival task.
        """
        from ooe.travel.tasks import complete_flight  # avoid circular import

        # Check and complete flight if user has already arrived
        TravelController.check_and_complete_active_flight(user)

        # --- Validation ---
        current_city_name = user.city.name

        if current_city_name == destination_city_name:
            raise OOEException('Already in the destination city.')

        routes = TRAVEL_ROUTES.get(current_city_name, {})
        if destination_city_name not in routes:
            raise OOEException('No route available to this city.')

        if airplane_key not in AIRPLANES:
            raise OOEException('Invalid airplane.')

        airplane = AIRPLANES[airplane_key]
        if airplane_key != 'commercial_flight':
            if not user.airplanes.filter(airplane=airplane_key).exists():
                raise OOEException('You do not own this airplane.')

        # Check for active flight
        active_flight = FlightLog.objects.filter(
            user=user, arrived_at__isnull=True
        ).first()
        if active_flight:
            raise OOEException('Already in flight.')

        # Check cooldown
        latest_flight = FlightLog.objects.filter(
            user=user, arrived_at__isnull=False
        ).order_by('-arrived_at').first()
        if latest_flight and latest_flight.cooldown_until:
            if latest_flight.cooldown_until > timezone.now():
                raise OOEException('Airplane is on cooldown.')

        # --- Cost & Time ---
        route = routes[destination_city_name]
        base_cost = route['cost']
        base_time_minutes = route['time_minutes']

        ticket_cost = int(base_cost * airplane['price_multiplier'])
        # Actual flight time in minutes: base / (REDUCER * speed_multiplier)
        actual_minutes = base_time_minutes / (TRAVEL_TIME_REDUCER * airplane['speed_multiplier'])
        # Round up to the nearest second
        actual_seconds = math.ceil(actual_minutes * 60)

        if user.money_cash < ticket_cost:
            raise OOEException('Not enough money.')

        # Fetch city objects
        destination_city = City.objects.get(name=destination_city_name)

        now = timezone.now()
        arrival_time = now + timedelta(seconds=actual_seconds)

        # Deduct money
        from django.db.models import F
        from ooe.users.models import User as UserModel
        UserModel.objects.filter(id=user.id).update(
            money_cash=F('money_cash') - ticket_cost
        )

        # Create flight log
        flight_log = FlightLog.objects.create(
            user=user,
            airplane=airplane_key,
            origin_city=user.city,
            destination_city=destination_city,
            cost=ticket_cost,
            departed_at=now,
            arrival_time=arrival_time,
        )

        # Schedule Celery task to fire at arrival
        complete_flight.apply_async(
            args=[flight_log.id],
            countdown=actual_seconds,
        )

        return {
            'status': 'success',
            'flight_id': flight_log.id,
            'destination_city': destination_city_name,
            'arrival_time': arrival_time.timestamp(),
            'cost': ticket_cost,
        }

    @staticmethod
    @transaction.atomic
    def complete_flight(flight_log_id: int):
        """
        Called by the Celery task on arrival.
        Atomically:
          1. Marks the flight as arrived
          2. Updates user's city
          3. Removes user from old city chat room
          4. Adds user to new city chat room
          5. Sets cooldown_until based on airplane used
        """
        try:
            flight_log = FlightLog.objects.select_related(
                'user', 'origin_city', 'destination_city'
            ).get(id=flight_log_id, arrived_at__isnull=True)
        except FlightLog.DoesNotExist:
            # Already completed or doesn't exist
            return

        user = flight_log.user
        destination_city = flight_log.destination_city
        airplane = AIRPLANES[flight_log.airplane]

        now = timezone.now()
        cooldown_minutes = airplane['cooldown_minutes']
        cooldown_until = now + timedelta(minutes=cooldown_minutes)

        # 1. Mark flight as arrived
        flight_log.arrived_at = now
        flight_log.cooldown_until = cooldown_until
        flight_log.save(update_fields=['arrived_at', 'cooldown_until'])

        # 2. Update user's city
        user.city = destination_city
        user.save(update_fields=['city'])

        # 3. Remove from old city chat room
        old_city_room = ChatRoom.objects.filter(
            city=flight_log.origin_city,
            chat_type='city',
        ).first()
        if old_city_room:
            old_city_room.users.remove(user)

        # 4. Add to new city chat room
        new_city_room = ChatRoom.objects.filter(
            city=destination_city,
            chat_type='city',
        ).first()
        if new_city_room:
            new_city_room.users.add(user)
