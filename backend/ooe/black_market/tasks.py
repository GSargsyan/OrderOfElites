import random
from decimal import Decimal
from datetime import timedelta
import json
from django.conf import settings

from celery import shared_task
from django.utils import timezone
from django.core.cache import cache

from ooe.black_market.models import SaleRecord, DrugPrice
from ooe.black_market.constants import (
    BASE_PRICES,
    PRICE_ABSORBER,
    PRICE_MIN,
    PRICE_MAX,
    POPULATION_LOOKBACK_HOURS,
    SUPPLY_WINDOW_MINUTES,
    NOISE_MIN,
    NOISE_MAX,
    DRUG_TYPES,
)
import redis

# Redis client for pub/sub
redis_client = redis.Redis.from_url(settings.CELERY_BROKER_URL)

@shared_task
def update_prices():
    """
    Runs every PRICE_TICK_SECONDS (60s).
    Recalculates prices for every (city, drug_type) combination using:

    Price per unit = B * [ (P * A) / ( (P * A) + S ) ] * R

    B = Base price of the drug
    P = Population (unique players logged in within last 24 hours)
    A = Market price fluctuation absorber (higher = more stable)
    S = Supply (weighted sum of units sold in this city in the last 24 hours)
    R = Random noise multiplier (between 0.92 and 1.08)

    Result is clamped between PRICE_MIN and PRICE_MAX for each drug type.
    """
    from ooe.users.models import User
    from ooe.cities.models import City

    now = timezone.now()
    supply_cutoff = now - timedelta(minutes=SUPPLY_WINDOW_MINUTES)
    population_cutoff = now - timedelta(hours=POPULATION_LOOKBACK_HOURS)

    # P = active players (logged in recently)
    population = User.objects.filter(
        last_login_time__gte=population_cutoff
    ).count()

    # Ensure P is at least 1 to avoid division by zero
    population = max(population, 1)

    cities = City.objects.all()

    for city in cities:
        for drug_type in DRUG_TYPES:
            B = Decimal(str(BASE_PRICES[drug_type]))
            A = Decimal(str(PRICE_ABSORBER[drug_type]))
            P = Decimal(str(population))

            # Fetch sales in the 24 hour window
            sales = SaleRecord.objects.filter(
                city=city,
                drug_type=drug_type,
                recorded_at__gte=supply_cutoff,
            )

            # Calculate weighted supply S
            S = Decimal('0')
            for sale in sales:
                elapsed = now - sale.recorded_at
                elapsed_minutes = Decimal(str(elapsed.total_seconds() / 60.0))
                # Effect grows linearly from 0 to 100% over 60 minutes
                weight = min(Decimal('1'), elapsed_minutes / Decimal('60'))
                S += sale.quantity * weight

            # R = random noise
            R = Decimal(str(random.uniform(NOISE_MIN, NOISE_MAX)))

            # Formula: Price = B * ((P * A) / ((P * A) + S)) * R
            pa = P * A
            price = B * (pa / (pa + S)) * R

            # Clamp to min/max bounds
            price_floor = Decimal(str(PRICE_MIN[drug_type]))
            price_ceiling = Decimal(str(PRICE_MAX[drug_type]))
            price = max(price_floor, min(price_ceiling, price))

            DrugPrice.objects.update_or_create(
                city=city,
                drug_type=drug_type,
                defaults={'price': price},
            )
            
    # Publish prices updated event to Redis
    redis_client.publish('prices_updated', json.dumps({
        'timestamp': now.timestamp(),
        'message': 'Prices have been updated.'
    }))


@shared_task
def cleanup_sale_records():
    """
    Runs every 10 minutes.
    Deletes SaleRecord entries older than SUPPLY_WINDOW_MINUTES.
    """
    cutoff = timezone.now() - timedelta(minutes=SUPPLY_WINDOW_MINUTES)
    SaleRecord.objects.filter(recorded_at__lt=cutoff).delete()
