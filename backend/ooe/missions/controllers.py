import time
import random

from django.core.cache import cache
from django.db.models import F

from ooe.users.models import User
from ooe.base.exceptions import OOEException
from ooe.base.constants import \
    RANK_REQUIREMENTS, \
    MISSIONS, \
    RANK_EXPS


class Missions:
    def __init__(self, user: object):
        self.user = user

    def get_missions_tab_data(self):
        return {
            'stakeout': Mission('stakeout', self.user).get_tab_data(),
            'recon_op': Mission('recon_op', self.user).get_tab_data(),
        }


class Mission:
    def __init__(self, name: str, user: object):
        self.name = name
        self.user = user

    def validate_start(self):
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