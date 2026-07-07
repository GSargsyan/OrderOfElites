from decimal import Decimal
from datetime import timedelta

from django.db.models import F, Count, Q
from django.utils import timezone

from ooe.users.models import User
from ooe.base.exceptions import OOEException
from ooe.black_market.models import PlayerDrugState, Professional, DrugPrice
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

        # Compute the production rate per second for this step
        # (used by frontend for smooth interpolation)
        consume_rate_per_sec = Decimal(str(step['consume_rate'])) / 3600 * trained_count
        available_input = Decimal(str(getattr(state, step['consumes_from'])))

        if step['produces_to'] is not None:
            # Material step
            produce_rate_per_sec = Decimal(str(step['produce_rate'])) / 3600 * trained_count
            current_qty = Decimal(str(getattr(state, step['produces_to'])))

            # If input is zero, production stalls
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
                'is_money_step': False,
            }
        else:
            # Money step (dealers/distributors)
            if available_input <= 0:
                consume_rate_per_sec = Decimal('0')

            current_price = self._get_current_price(state.drug_type)
            money_rate_per_sec = consume_rate_per_sec * current_price

            return {
                'role': role,
                'label': step['label'],
                'count': total_count,
                'trained_count': trained_count,
                'training_count': training_count,
                'output_qty': float(state.pending_money),
                'rate_per_second': float(money_rate_per_sec),
                'is_money_step': True,
                'current_price': float(current_price),
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

            steps_data = []
            for step in chain['steps']:
                steps_data.append(self._build_step_data(state, step, now))

            drug_rows[drug_type] = {
                'unlocked': unlocked,
                'rank_required': rank_required,
                'precursor_name': PRECURSOR_NAMES[drug_type],
                'precursor_price': PRECURSOR_PRICES[drug_type],
                'precursor_qty': float(state.precursor_qty),
                'pending_money': float(state.pending_money),
                'steps': steps_data,
            }

        return {
            'total_professionals': total_profs,
            'max_professionals': max_profs,
            'drug_rows': drug_rows,
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

        User.objects.filter(id=self.user.id).update(
            money_cash=F('money_cash') - price
        )

        PlayerDrugState.objects.filter(id=state.id).update(
            precursor_qty=F('precursor_qty') + 1
        )

        state.refresh_from_db()

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

        now = timezone.now()
        trained_at = now + timedelta(minutes=TRAINING_TIME_MINUTES)

        Professional.objects.create(
            player_drug_state=state,
            role=role,
            trained_at=trained_at,
            is_trained=False,
        )

        return {
            'status': 'success',
            'total_professionals': self._total_professionals(),
        }

    def remove_professional(self, drug_type, role):
        """
        Remove one professional of the given role.
        No refund, no cooldown. Professional returns to unassigned pool
        immediately. Must retrain if reassigned (even to same role).
        """
        if drug_type not in DRUG_TYPES:
            raise OOEException('Invalid drug type')

        if role not in ALL_ROLES:
            raise OOEException('Invalid role')

        state = self._get_or_create_state(drug_type)

        # Remove the oldest professional of this role (FIFO)
        professional = state.professionals.filter(role=role).order_by('created_at').first()

        if professional is None:
            raise OOEException('No professional of this role to remove')

        professional.delete()

        return {
            'status': 'success',
            'total_professionals': self._total_professionals(),
        }

    def withdraw_money(self, drug_type):
        """
        Move accumulated pending_money to the player's cash balance.
        Player must be in the city where the production is.
        """
        if drug_type not in DRUG_TYPES:
            raise OOEException('Invalid drug type')

        state = self._get_or_create_state(drug_type)

        if state.pending_money <= 0:
            raise OOEException('No money to withdraw')

        amount = state.pending_money

        User.objects.filter(id=self.user.id).update(
            money_cash=F('money_cash') + amount
        )

        PlayerDrugState.objects.filter(id=state.id).update(
            pending_money=0
        )

        return {
            'status': 'success',
            'withdrawn': float(amount),
        }
