import time
import random
from datetime import timedelta

from django.core.cache import cache
from django.db import transaction
from django.db.models import F, Q
from django.utils import timezone

from ooe.users.models import User
from ooe.items.models import UserCar
from ooe.items.constants import CARS
from ooe.base.exceptions import OOEException
from ooe.base.constants import RANK_EXPS
from ooe.missions.constants import \
    RANK_REQUIREMENTS, \
    MISSIONS, \
    SIMPLE_MISSIONS
from ooe.missions.models import ExtractionMission


class MissionsController:
    def __init__(self, user: object):
        self.user = user

    def get_missions_tab_data(self):
        return {
            'stakeout': Mission('stakeout', self.user).get_tab_data(),
            'recon_op': Mission('recon_op', self.user).get_tab_data(),
            'extraction': ExtractionController(self.user).get_tab_data(),
        }


class Mission:
    def __init__(self, name: str, user: object):
        self.name = name
        self.user = user

    def validate_start(self):
        if self.name not in SIMPLE_MISSIONS:
            raise OOEException('Invalid mission')

        cd_remaining = cache.get(f'user_{self.user.id}_{self.name}_cd')

        if cd_remaining is not None and cd_remaining > int(time.time()):
            raise OOEException('Mission is on cooldown')

        if RANK_REQUIREMENTS[self.name] > self.user.rank:
            raise OOEException('Rank is too low')

    def get_tab_data(self):
        return {
            'allowed': self.user.rank >= RANK_REQUIREMENTS[self.name],
            'cd_remaining': cache.get(f'user_{self.user.id}_{self.name}_cd') or 0,
        }

    def generate_reward(self):
        abs_exp_diff = RANK_EXPS[MISSIONS[self.name]['max_reward_rank']] - RANK_EXPS[RANK_REQUIREMENTS[self.name]]
        exp_passed = self.user.exp - RANK_EXPS[RANK_REQUIREMENTS[self.name]]
        progress = (exp_passed / abs_exp_diff)
        reward_range_diff = MISSIONS[self.name]['max_reward'] - MISSIONS[self.name]['min_reward']

        reward_range_progress = int(reward_range_diff * progress)

        lower_bound_rank = MISSIONS[self.name]['min_reward'] + reward_range_progress
        lower_bound_max = MISSIONS[self.name]['max_reward'] - MISSIONS[self.name]['random_range']
        min_reward = min(lower_bound_rank, lower_bound_max)

        # $0 reward is not allowed
        min_reward = max(min_reward, 1)
        max_reward_mission = MISSIONS[self.name]['max_reward']

        max_reward = min(max_reward_mission, min_reward + MISSIONS[self.name]['random_range'])

        return random.randint(min_reward, max_reward)

    def start(self):
        # TODO: log missions in mission log
        self.validate_start()

        reward = self.generate_reward()
        exp_reward = MISSIONS[self.name]['exp_reward']
        # update experience
        User.objects.filter(id=self.user.id).update(money_cash=F('money_cash') + reward)
        self.user.add_exp(exp_reward)


        cd = int(time.time()) + MISSIONS[self.name]['cooldown']

        cache.set(f'user_{self.user.id}_{self.name}_cd',
            cd,
            timeout = MISSIONS[self.name]['cooldown'])

        return {'reward': reward,
                'exp_reward': exp_reward,
                'cd_remaining': cd}


class ExtractionController:
    def __init__(self, user: object):
        self.user = user

    @staticmethod
    def cd_key(user_id):
        return f'user_{user_id}_extraction_cd'

    @staticmethod
    def invite_expiry_cutoff():
        return timezone.now() - timedelta(seconds=MISSIONS['extraction']['invite_ttl'])

    def get_cd_remaining(self, user_id):
        return cache.get(self.cd_key(user_id)) or 0

    def get_active_mission(self):
        """The single mission the user is currently part of, if any.
        A pending incoming invitation does not count for the driver."""
        mission = ExtractionMission.objects.filter(
            Q(initiator=self.user, status__in=ExtractionMission.ACTIVE_STATUSES) |
            Q(driver=self.user, status__in=ExtractionMission.JOINED_STATUSES)
        ).select_related('initiator', 'driver').first()

        # lazily expire the initiator's own stale invitation so they aren't
        # stuck waiting on the per-minute celery sweep
        if mission is not None and \
                mission.status == ExtractionMission.INVITED and \
                mission.created_at < self.invite_expiry_cutoff():
            mission.status = ExtractionMission.EXPIRED
            mission.save(update_fields=['status', 'updated_at'])
            return None

        return mission

    def serialize_mission(self, mission):
        return {
            'id': mission.id,
            'status': mission.status,
            'role': 'initiator' if mission.initiator_id == self.user.id else 'driver',
            'initiator': mission.initiator.username,
            'driver': mission.driver.username,
            'car': mission.car,
            'car_name': CARS[mission.car]['name'] if mission.car else None,
        }

    def get_invitations(self):
        """Pending invitations visible to the user as a driver. An invitation
        only shows while the initiator is in the same city, keeping locations
        secret."""
        invitations = ExtractionMission.objects.filter(
            driver=self.user,
            status=ExtractionMission.INVITED,
            created_at__gte=self.invite_expiry_cutoff(),
            initiator__city=self.user.city,
        ).select_related('initiator').order_by('created_at')

        ttl = MISSIONS['extraction']['invite_ttl']

        return [{
            'id': inv.id,
            'initiator': inv.initiator.username,
            'expires_at': (inv.created_at + timedelta(seconds=ttl)).timestamp(),
        } for inv in invitations]

    def get_available_cars(self):
        """Car models the user owns at least 1 of in their current city."""
        owned = set(UserCar.objects.filter(
            user=self.user,
            city=self.user.city,
        ).values_list('car', flat=True))

        return [{'key': key, 'name': CARS[key]['name']}
                for key in CARS if key in owned]

    def get_tab_data(self):
        allowed = self.user.rank >= RANK_REQUIREMENTS['extraction']
        cd_remaining = self.get_cd_remaining(self.user.id)

        data = {
            'allowed': allowed,
            'cd_remaining': cd_remaining,
            'mode': 'idle',
            'invitations': [],
            'mission': None,
            'cars': [],
        }

        if not allowed:
            return data

        mission = self.get_active_mission()
        if mission is not None:
            data['mode'] = 'active'
            data['mission'] = self.serialize_mission(mission)
            if mission.driver_id == self.user.id:
                data['cars'] = self.get_available_cars()
        elif cd_remaining <= int(time.time()):
            data['invitations'] = self.get_invitations()

        return data

    def validate_participation(self):
        if self.user.rank < RANK_REQUIREMENTS['extraction']:
            raise OOEException('Rank is too low')

        cd_remaining = cache.get(self.cd_key(self.user.id))
        if cd_remaining is not None and cd_remaining > int(time.time()):
            raise OOEException('Mission is on cooldown')

        if self.get_active_mission() is not None:
            raise OOEException('You are already part of an Extraction mission')

    @transaction.atomic
    def invite(self, username: str):
        self.validate_participation()

        username = (username or '').strip()
        if not username:
            raise OOEException('Enter a username to invite')

        target = User.objects.filter(username__iexact=username).first()
        if target is None:
            raise OOEException('No Elite found by that name')

        if target.id == self.user.id:
            raise OOEException('You cannot invite yourself')

        if target.rank < RANK_REQUIREMENTS['extraction']:
            raise OOEException('That Elite has not reached the required rank')

        # No checks on the target's city, cooldown or current mission —
        # that would leak info about them. The invitation simply hangs
        # unseen until it expires.
        ExtractionMission.objects.create(
            initiator=self.user,
            driver=target,
            city=self.user.city,
        )

        return {'status': 'success'}

    @transaction.atomic
    def accept(self, mission_id):
        self.validate_participation()

        mission = ExtractionMission.objects.select_for_update(of=('self',)).select_related('initiator').filter(
            id=mission_id,
            driver=self.user,
            status=ExtractionMission.INVITED,
        ).first()

        if mission is None or \
                mission.created_at < self.invite_expiry_cutoff() or \
                mission.initiator.city_id != self.user.city_id:
            raise OOEException('Invitation is no longer available')

        mission.status = ExtractionMission.ACCEPTED
        mission.accepted_at = timezone.now()
        mission.save(update_fields=['status', 'accepted_at', 'updated_at'])

        return {'status': 'success'}

    @transaction.atomic
    def reject(self, mission_id):
        mission = ExtractionMission.objects.select_for_update(of=('self',)).filter(
            id=mission_id,
            driver=self.user,
            status=ExtractionMission.INVITED,
        ).first()

        if mission is None:
            raise OOEException('Invitation is no longer available')

        mission.status = ExtractionMission.REJECTED
        mission.save(update_fields=['status', 'updated_at'])

        return {'status': 'success'}

    @transaction.atomic
    def ready(self, mission_id, car: str):
        mission = ExtractionMission.objects.select_for_update(of=('self',)).filter(
            id=mission_id,
            driver=self.user,
            status=ExtractionMission.ACCEPTED,
        ).first()

        if mission is None:
            raise OOEException('Mission is no longer available')

        if car not in CARS:
            raise OOEException('Invalid car')

        if not UserCar.objects.filter(user=self.user, car=car, city=self.user.city).exists():
            raise OOEException('You do not own this car in this city')

        mission.car = car
        mission.status = ExtractionMission.READY
        mission.save(update_fields=['car', 'status', 'updated_at'])

        return {'status': 'success'}

    @transaction.atomic
    def unready(self, mission_id):
        mission = ExtractionMission.objects.select_for_update(of=('self',)).filter(
            id=mission_id,
            driver=self.user,
            status=ExtractionMission.READY,
        ).first()

        if mission is None:
            raise OOEException('Mission is no longer available')

        mission.car = None
        mission.status = ExtractionMission.ACCEPTED
        mission.save(update_fields=['car', 'status', 'updated_at'])

        return {'status': 'success'}

    @transaction.atomic
    def cancel(self, mission_id):
        """Either participant backs out at any stage before start."""
        mission = ExtractionMission.objects.select_for_update(of=('self',)).filter(
            Q(initiator=self.user) | Q(driver=self.user),
            id=mission_id,
            status__in=ExtractionMission.ACTIVE_STATUSES,
        ).first()

        if mission is None:
            raise OOEException('Mission is no longer available')

        mission.status = ExtractionMission.CANCELLED
        mission.save(update_fields=['status', 'updated_at'])

        return {'status': 'success'}

    def start(self, mission_id):
        car_missing = False

        with transaction.atomic():
            mission = ExtractionMission.objects.select_for_update(of=('self',)).select_related(
                'initiator', 'driver'
            ).filter(
                id=mission_id,
                initiator=self.user,
                status=ExtractionMission.READY,
            ).first()

            if mission is None:
                raise OOEException('Mission is not ready to start')

            now_ts = int(time.time())
            for user_id in (mission.initiator_id, mission.driver_id):
                cd_remaining = cache.get(self.cd_key(user_id))
                if cd_remaining is not None and cd_remaining > now_ts:
                    raise OOEException('Mission is on cooldown')

            # cities may have changed since the invitation, re-check live
            if mission.initiator.city_id != mission.driver.city_id:
                raise OOEException('The Driver is no longer available')

            # consume one of the driver's cars of the chosen model
            car = UserCar.objects.select_for_update().filter(
                user=mission.driver,
                car=mission.car,
                city_id=mission.driver.city_id,
            ).first()

            if car is None:
                # driver sold the car in the meantime, drop back to car choice
                mission.car = None
                mission.status = ExtractionMission.ACCEPTED
                mission.save(update_fields=['car', 'status', 'updated_at'])
                car_missing = True
            else:
                car.delete()

                reward = MISSIONS['extraction']['reward']
                exp_reward = MISSIONS['extraction']['exp_reward']

                User.objects.filter(id=mission.initiator_id).update(money_cash=F('money_cash') + reward)
                self.user.add_exp(exp_reward)
                mission.driver.add_exp(exp_reward)

                mission.reward = reward
                mission.exp_reward = exp_reward
                mission.status = ExtractionMission.COMPLETED
                mission.completed_at = timezone.now()
                mission.save(update_fields=['reward', 'exp_reward', 'status', 'completed_at', 'updated_at'])

                cooldown = MISSIONS['extraction']['cooldown']
                cd = now_ts + cooldown
                cache.set(self.cd_key(mission.initiator_id), cd, timeout=cooldown)
                cache.set(self.cd_key(mission.driver_id), cd, timeout=cooldown)

        # raised outside the transaction so the status downgrade commits
        if car_missing:
            raise OOEException('The Driver no longer owns the chosen car')

        return {'reward': reward,
                'exp_reward': exp_reward,
                'cd_remaining': cd}