import random
from decimal import Decimal
from datetime import timedelta

from celery import shared_task
from django.utils import timezone
from django.db.models import Sum

from ooe.black_market.models import PlayerDrugState, Professional, SaleRecord, DrugPrice
from ooe.black_market.constants import (
    PRODUCTION_CHAINS,
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


@shared_task
def process_production():
    """
    Runs every PRODUCTION_TICK_SECONDS (10s).
    For every PlayerDrugState with at least one trained professional,
    compute elapsed time since last tick, consume inputs, produce outputs.
    Final-step professionals generate money at the current city price.
    """
    now = timezone.now()

    # Mark professionals as trained if their training time has passed
    Professional.objects.filter(
        is_trained=False,
        trained_at__lte=now,
    ).update(is_trained=True)

    # Fetch all states that have at least one trained professional
    states = PlayerDrugState.objects.filter(
        professionals__is_trained=True,
    ).select_related('city').distinct()

    for state in states:
        elapsed_hours = Decimal(
            str((now - state.last_tick_at).total_seconds() / 3600)
        )

        if elapsed_hours <= 0:
            continue

        chain = PRODUCTION_CHAINS.get(state.drug_type)
        if not chain:
            continue

        # Get current price for the money step
        try:
            current_price = DrugPrice.objects.get(
                city=state.city,
                drug_type=state.drug_type,
            ).price
        except DrugPrice.DoesNotExist:
            current_price = Decimal(str(BASE_PRICES.get(state.drug_type, 0)))

        total_sold_qty = Decimal('0')

        for step in chain['steps']:
            trained_count = state.professionals.filter(
                role=step['role'],
                is_trained=True,
            ).count()

            if trained_count == 0:
                continue

            consume_rate = Decimal(str(step['consume_rate']))
            available_input = getattr(state, step['consumes_from'])

            would_consume = consume_rate * trained_count * elapsed_hours
            actual_consumed = min(would_consume, available_input)

            if actual_consumed <= 0:
                continue

            # Deduct input
            new_input = available_input - actual_consumed
            setattr(state, step['consumes_from'], new_input)

            if step['produces_to'] is not None:
                # Material step: produce output
                produce_rate = Decimal(str(step['produce_rate']))
                ratio = produce_rate / consume_rate
                actual_produced = actual_consumed * ratio

                current_output = getattr(state, step['produces_to'])
                setattr(state, step['produces_to'], current_output + actual_produced)
            else:
                # Money step: convert consumed units to money at current price
                money_earned = actual_consumed * current_price
                state.pending_money += money_earned
                total_sold_qty += actual_consumed

        state.last_tick_at = now
        state.save()

        # Log sale for supply tracking (used in price formula)
        if total_sold_qty > 0:
            SaleRecord.objects.create(
                city=state.city,
                drug_type=state.drug_type,
                quantity=total_sold_qty,
            )


@shared_task
def update_prices():
    """
    Runs every PRICE_TICK_SECONDS (60s).
    Recalculates prices for every (city, drug_type) combination using:

    Price per unit = B * [ (P * A) / ( (P * A) + S ) ] * R

    B = Base price of the drug
    P = Population (unique players logged in within last 24 hours)
    A = Market price fluctuation absorber (higher = more stable)
    S = Supply (total units sold in this city in the last 30 minutes)
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
        last_login__gte=population_cutoff
    ).count()

    # Ensure P is at least 1 to avoid division by zero
    population = max(population, 1)

    cities = City.objects.all()

    for city in cities:
        for drug_type in DRUG_TYPES:
            B = Decimal(str(BASE_PRICES[drug_type]))
            A = Decimal(str(PRICE_ABSORBER[drug_type]))
            P = Decimal(str(population))

            # S = total units sold in this city in the last SUPPLY_WINDOW_MINUTES
            supply_agg = SaleRecord.objects.filter(
                city=city,
                drug_type=drug_type,
                recorded_at__gte=supply_cutoff,
            ).aggregate(total=Sum('quantity'))

            S = supply_agg['total'] or Decimal('0')

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


@shared_task
def cleanup_sale_records():
    """
    Runs every 10 minutes.
    Deletes SaleRecord entries older than SUPPLY_WINDOW_MINUTES.
    """
    cutoff = timezone.now() - timedelta(minutes=SUPPLY_WINDOW_MINUTES)
    SaleRecord.objects.filter(recorded_at__lt=cutoff).delete()
