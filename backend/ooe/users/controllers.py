import time
import random

from django.core.cache import cache
from django.db.models import F

from ooe.users.models import User
from ooe.base.exceptions import OOEException
from ooe.base.constants import SKILLS


class SkillsController:
    def __init__(self, user: object):
        self.user = user

    def get_skills_tab_data(self):
        return {
            'attack_free_cd': cache.get(f'user_{self.user.id}_attack_free_cd') or 0,
            'defense_free_cd': cache.get(f'user_{self.user.id}_defense_free_cd') or 0,
            'driving_free_cd': cache.get(f'user_{self.user.id}_driving_free_cd') or 0,
            'attack_pro_cd': cache.get(f'user_{self.user.id}_attack_pro_cd') or 0,
            'defense_pro_cd': cache.get(f'user_{self.user.id}_defense_pro_cd') or 0,
            'driving_pro_cd': cache.get(f'user_{self.user.id}_driving_pro_cd') or 0,
            'attack_pro_price': SKILLS['attack_pro']['price'],
            'defense_pro_price': SKILLS['defense_pro']['price'],
            'driving_pro_price': SKILLS['driving_pro']['price'],
        }

    def validate_practice(self, skill_name: str):
        cd_remaining = cache.get(f'user_{self.user.id}_{skill_name}_cd')
        skill = SKILLS[skill_name]

        if skill['price'] > self.user.money_cash:
            raise OOEException('Not enough money')

        if cd_remaining is not None and cd_remaining > int(time.time()):
            raise OOEException('Skill training is on cooldown')

    def start_practice(self, skill_name: str):
        self.validate_practice(skill_name)

        skill = SKILLS[skill_name]
        points_gained = skill['points']

        update_fields = {
            'money_cash': F('money_cash') - skill['price'],
            f"{skill['users_field']}": F(f"{skill['users_field']}") + points_gained
        }

        User.objects.filter(id=self.user.id).update(
            **update_fields
        )

        self.user.add_exp(skill['exp_reward'])

        cd = int(time.time()) + skill['cooldown']

        cache.set(f'user_{self.user.id}_{skill_name}_cd',
            cd,
            timeout = skill['cooldown'])

        return {
                'points_gained': points_gained,
                'exp_gained': skill['exp_reward'],
                'cd_remaining': cd}