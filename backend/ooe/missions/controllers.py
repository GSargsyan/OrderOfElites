import time

from django.core.cache import cache

from ooe.base.exceptions import OOEException
from ooe.base.constants import \
    RANK_REQUIREMENTS, \
    MISSIONS, \
    RANK_EXPS

### cache.set('my_key', 'value')  # Set a key with a 5-minute expiry

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
            'allowed': RANK_REQUIREMENTS[self.name] >= self.user.rank,
            'cd_remaining': cache.get(f'user_{self.user.id}_{self.name}_cd'),
        }

    def generate_reward(self):
        abs_exp_diff = RANK_EXPS[MISSIONS[self.name]['max_reward_rank']] - RANK_EXPS[RANK_REQUIREMENTS[self.name]]
        exp_passed = self.user.exp - RANK_EXPS[RANK_REQUIREMENTS[self.name]]
        progress = (exp_passed / abs_exp_diff)
        reward_range_diff = MISSIONS[self.name]['max_reward'] - MISSIONS[self.name]['min_reward']

        reward_range_progress = reward_range_diff * progress

        min_reward = MISSIONS[self.name]['min_reward'] + reward_range_progress
        max_reward = MISSIONS[self.name]['max_reward']

        max_reward = max(max_reward, min_reward + MISSIONS[self.name]['reward_range'])

        return random.randint(min_reward, max_reward)

    def start(self):
        self.validate_start()

        reward = self.generate_reward()
        # TODO: continue from here

        cache.set(f'user_{self.user.id}_{self.name}_cd',
                  int(time.time()) + MISSIONS[self.name]['cooldown'],
                  timeout=MISSIONS[self.name]['cooldown'])