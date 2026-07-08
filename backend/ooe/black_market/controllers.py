import json
from decimal import Decimal
from datetime import timedelta

from django.db.models import F, Sum
from django.utils import timezone
from django.conf import settings

from ooe.users.models import User
from ooe.base.exceptions import OOEException
from ooe.black_market.models import PlayerDrugState, Professional, DrugPrice, SaleRecord
from ooe.black_market.constants import (
    PROFESSIONALS_BASE_COUNT,
    PROFESSIONALS_PER_RANK,
    PROFESSIONALS_MAX,
    TRAINING_TIME_MINUTES,
    RANK_REQUIREMENTS,
    PRECURSOR_PRICES,
    PRECURSOR_NAMES,
    PRODUCTION_CHAINS,
    BASE_PRICES,
    DRUG_TYPES,
    ALL_ROLES,
    ROLE_TO_DRUG_TYPE,
)

import redis
redis_client = redis.Redis.from_url(settings.CELERY_BROKER_URL)


class BlackMarketController:
    def __init__(self, user):
        self.user = user

    def _max_professionals(self):
        """Max professionals allowed based on player rank."""
        return min(
            PROFESSIONALS_BASE_COUNT + PROFESSIONALS_PER_RANK * (self.user.rank - 1),
            PROFESSIONALS_MAX,
        )

    def _total_professionals(self):
        """Total professionals assigned across all drug types and cities."""
        return Professional.objects.filter(
            player_drug_state__user=self.user
        ).count()

    def _get_or_create_state(self, drug_type):
        """Get or create the PlayerDrugState for this user/drug/city."""
        state, _ = PlayerDrugState.objects.get_or_create(
            user=self.user,
            drug_type=drug_type,
            city=self.user.city,
        )
        return state

    def _get_current_price(self, drug_type):
        """Get current price for this drug in the user's city."""
        try:
            return DrugPrice.objects.get(
                city=self.user.city,
                drug_type=drug_type,
            ).price
        except DrugPrice.DoesNotExist:
            return Decimal(str(BASE_PRICES[drug_type]))

    def publish_state_update(self):
        """Fetch current tab data and push to Redis for WebSocket broadcast."""
        payload = self.get_tab_data()
        redis_client.publish(
            f'user_market_update:{self.user.id}',
            json.dumps(payload)
        )

    def lazy_update_state(self, state):
        """
        Event-based simulation of production.
        Accurately calculates production, consumption, and handles cascading starvation
        (e.g., when precursor runs out, then intermediate runs out later)
        and professionals finishing their training while offline.
        """
        now = timezone.now()
        if state.last_tick_at >= now:
            return state

        chain = PRODUCTION_CHAINS.get(state.drug_type)
        if not chain:
            state.last_tick_at = now
            state.save(update_fields=['last_tick_at'])
            return state

        # Event-based simulation loop
        while state.last_tick_at < now:
            next_training_prof = state.professionals.filter(
                trained_at__gt=state.last_tick_at,
                trained_at__lte=now
            ).order_by('trained_at').first()

            max_advance_time = (now - state.last_tick_at).total_seconds()
            
            if next_training_prof:
                prof_time = (next_training_prof.trained_at - state.last_tick_at).total_seconds()
                if prof_time < max_advance_time:
                    max_advance_time = prof_time

            # Calculate current production/consumption rates per SECOND
            trained_counts = {}
            for step in chain['steps']:
                count = state.professionals.filter(
                    role=step['role'],
                    trained_at__lte=state.last_tick_at
                ).count()
                trained_counts[step['role']] = count

            rates = {}
            for step in chain['steps']:
                role = step['role']
                count = trained_counts[role]
                c_rate = Decimal(str(step['consume_rate'])) / Decimal('3600') * count
                p_rate = Decimal(str(step['produce_rate'])) / Decimal('3600') * count if step['produces_to'] else Decimal('0')

                input_field = step['consumes_from']
                available_input = getattr(state, input_field)
                
                # If no input available, step stops
                if available_input <= 0:
                    c_rate = Decimal('0')
                    p_rate = Decimal('0')

                rates[input_field] = rates.get(input_field, Decimal('0')) - c_rate
                if step['produces_to']:
                    rates[step['produces_to']] = rates.get(step['produces_to'], Decimal('0')) + p_rate

            # Find next starvation event
            starvation_time = max_advance_time
            for resource, net_rate in rates.items():
                if net_rate < 0:
                    current_qty = getattr(state, resource)
                    if current_qty > 0:
                        time_to_empty = float(current_qty / abs(net_rate))
                        if time_to_empty < starvation_time:
                            starvation_time = time_to_empty

            advance_seconds = Decimal(str(starvation_time))
            if advance_seconds <= 0:
                # Prevent infinite loop on float precision edge cases
                advance_seconds = Decimal('0.001')

            # Apply rates
            for resource, net_rate in rates.items():
                current = getattr(state, resource)
                new_qty = current + (net_rate * advance_seconds)
                if new_qty < 0:
                    new_qty = Decimal('0')
                setattr(state, resource, new_qty)

            # Advance tick
            state.last_tick_at += timedelta(seconds=float(advance_seconds))
            if state.last_tick_at > now:
                state.last_tick_at = now

        # Final cleanup: mark all professionals trained up to 'now'
        Professional.objects.filter(
            player_drug_state=state,
            is_trained=False,
            trained_at__lte=now,
        ).update(is_trained=True)

        state.last_tick_at = now
        state.save()
        return state

    def _build_step_data(self, state, step, now):
        """Build frontend data for a single production step."""
        role = step['role']

        trained_count = state.professionals.filter(
            role=role, is_trained=True
        ).count()

        training_count = state.professionals.filter(
            role=role, is_trained=False
        ).count()

        total_count = trained_count + training_count

        consume_rate_per_sec = Decimal(str(step['consume_rate'])) / 3600 * trained_count
        available_input = Decimal(str(getattr(state, step['consumes_from'])))

        produce_rate_per_sec = Decimal(str(step['produce_rate'])) / 3600 * trained_count if step['produces_to'] else Decimal('0')
        current_qty = Decimal(str(getattr(state, step['produces_to']))) if step['produces_to'] else Decimal('0')

        if available_input <= 0:
            produce_rate_per_sec = Decimal('0')
            consume_rate_per_sec = Decimal('0')

        return {
            'role': role,
            'label': step['label'],
            'count': total_count,
            'trained_count': trained_count,
            'training_count': training_count,
            'output_qty': float(current_qty),
            'rate_per_second': float(produce_rate_per_sec),
            'consume_rate_per_second': float(consume_rate_per_sec),
            'is_money_step': False, # Dealers no longer produce money, they produce stash_qty
        }

    def get_tab_data(self):
        """Return full Black Market state for the frontend."""
        now = timezone.now()
        max_profs = self._max_professionals()
        total_profs = self._total_professionals()

        drug_rows = {}
        for drug_type in DRUG_TYPES:
            chain = PRODUCTION_CHAINS[drug_type]
            rank_required = RANK_REQUIREMENTS[drug_type]
            unlocked = self.user.rank >= rank_required

            state = self._get_or_create_state(drug_type)
            state = self.lazy_update_state(state) # Lazily compute on read

            steps_data = []
            for step in chain['steps']:
                steps_data.append(self._build_step_data(state, step, now))

            # Compute net output rates and starvation
            starvation_timestamps = {}
            for i, step_data in enumerate(steps_data):
                next_consume = (
                    steps_data[i + 1]['consume_rate_per_second']
                    if i + 1 < len(steps_data) else 0.0
                )
                net_rate = step_data['rate_per_second'] - next_consume
                step_data['net_output_rate'] = float(net_rate)

                # Starvation for intermediate outputs
                if net_rate < 0 and step_data['output_qty'] > 0:
                    time_to_empty = step_data['output_qty'] / float(abs(net_rate))
                    starvation_timestamps[chain['steps'][i]['produces_to']] = (now + timedelta(seconds=time_to_empty)).timestamp()

            precursor_rate = (
                -steps_data[0]['consume_rate_per_second']
                if steps_data else 0.0
            )
            
            if precursor_rate < 0 and state.precursor_qty > 0:
                time_to_empty = float(state.precursor_qty) / float(abs(precursor_rate))
                starvation_timestamps['precursor_qty'] = (now + timedelta(seconds=time_to_empty)).timestamp()

            current_price = self._get_current_price(drug_type)

            drug_rows[drug_type] = {
                'unlocked': unlocked,
                'rank_required': rank_required,
                'precursor_name': PRECURSOR_NAMES[drug_type],
                'precursor_price': PRECURSOR_PRICES[drug_type],
                'precursor_qty': float(state.precursor_qty),
                'precursor_rate_per_second': float(precursor_rate),
                'stash_qty': float(state.stash_qty),
                'current_price': float(current_price),
                'starvation_timestamps': starvation_timestamps,
                'steps': steps_data,
            }

        return {
            'total_professionals': total_profs,
            'max_professionals': max_profs,
            'drug_rows': drug_rows,
            'server_time': timezone.now().timestamp(),
        }

    def buy_precursor(self, drug_type):
        """Buy 1 unit of precursor material for the given drug type."""
        if drug_type not in DRUG_TYPES:
            raise OOEException('Invalid drug type')

        if self.user.rank < RANK_REQUIREMENTS[drug_type]:
            raise OOEException('Rank too low')

        price = PRECURSOR_PRICES[drug_type]

        if self.user.money_cash < price:
            raise OOEException('Not enough money')

        state = self._get_or_create_state(drug_type)
        state = self.lazy_update_state(state) # Update to now

        User.objects.filter(id=self.user.id).update(
            money_cash=F('money_cash') - price
        )

        PlayerDrugState.objects.filter(id=state.id).update(
            precursor_qty=F('precursor_qty') + 1
        )
        
        self.user.refresh_from_db()
        state.refresh_from_db()
        self.publish_state_update()

        return {
            'status': 'success',
            'precursor_qty': float(state.precursor_qty),
        }

    def assign_professional(self, drug_type, role):
        """Assign a new professional to a role. Starts training."""
        if drug_type not in DRUG_TYPES:
            raise OOEException('Invalid drug type')

        if role not in ALL_ROLES:
            raise OOEException('Invalid role')

        if ROLE_TO_DRUG_TYPE[role] != drug_type:
            raise OOEException('Role does not belong to this drug type')

        if self.user.rank < RANK_REQUIREMENTS[drug_type]:
            raise OOEException('Rank too low')

        if self._total_professionals() >= self._max_professionals():
            raise OOEException('No available professionals')

        state = self._get_or_create_state(drug_type)
        state = self.lazy_update_state(state)

        now = timezone.now()
        trained_at = now + timedelta(minutes=TRAINING_TIME_MINUTES)

        Professional.objects.create(
            player_drug_state=state,
            role=role,
            trained_at=trained_at,
            is_trained=False,
        )

        self.publish_state_update()

        return {
            'status': 'success',
            'total_professionals': self._total_professionals(),
        }

    def remove_professional(self, drug_type, role):
        """Remove one professional of the given role."""
        if drug_type not in DRUG_TYPES:
            raise OOEException('Invalid drug type')

        if role not in ALL_ROLES:
            raise OOEException('Invalid role')

        state = self._get_or_create_state(drug_type)
        state = self.lazy_update_state(state)

        professional = state.professionals.filter(role=role).order_by('created_at').first()
        if professional is None:
            raise OOEException('No professional of this role to remove')

        professional.delete()
        self.publish_state_update()

        return {
            'status': 'success',
            'total_professionals': self._total_professionals(),
        }

    def sell_stash(self, drug_type):
        """Sell the entire stash_qty at current market price."""
        if drug_type not in DRUG_TYPES:
            raise OOEException('Invalid drug type')

        state = self._get_or_create_state(drug_type)
        state = self.lazy_update_state(state)

        if state.stash_qty <= 0:
            raise OOEException('No stash to sell')

        quantity_sold = state.stash_qty
        current_price = self._get_current_price(drug_type)
        amount_earned = quantity_sold * current_price

        # Update player money
        User.objects.filter(id=self.user.id).update(
            money_cash=F('money_cash') + amount_earned
        )

        # Clear stash
        PlayerDrugState.objects.filter(id=state.id).update(
            stash_qty=0
        )

        # Record sale to affect supply
        SaleRecord.objects.create(
            city=state.city,
            drug_type=state.drug_type,
            quantity=quantity_sold,
        )
        
        self.user.refresh_from_db()
        state.refresh_from_db()
        self.publish_state_update()

        return {
            'status': 'success',
            'sold_qty': float(quantity_sold),
            'earned': float(amount_earned),
        }
