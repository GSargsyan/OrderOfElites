import time

from django.core.cache import cache
from django.db.models import F

from ooe.users.models import User
from ooe.base.exceptions import OOEException
from ooe.base.constants import SKILLS, SKILL_COOLDOWNS


class SkillsController:
    def __init__(self, user: object):
        self.user = user

    def get_skills_tab_data(self):
        free_cd = cache.get(f'user_{self.user.id}_training_free_cd') or 0
        pro_cd = cache.get(f'user_{self.user.id}_training_pro_cd') or 0
        return {
            'attack_free_cd': free_cd,
            'defense_free_cd': free_cd,
            'driving_free_cd': free_cd,
            'attack_pro_cd': pro_cd,
            'defense_pro_cd': pro_cd,
            'driving_pro_cd': pro_cd,
            'attack_pro_price': SKILLS['attack_pro']['price'],
            'defense_pro_price': SKILLS['defense_pro']['price'],
            'driving_pro_price': SKILLS['driving_pro']['price'],
            'free_points': SKILLS['attack_free']['points'],
            'pro_points': SKILLS['attack_pro']['points'],
            'free_cooldown': SKILL_COOLDOWNS['free'],
            'pro_cooldown': SKILL_COOLDOWNS['pro'],
        }

    def validate_practice(self, skill_name: str):
        is_free = skill_name.endswith('_free')

        cd_remaining = cache.get(f'user_{self.user.id}_training_{"free" if is_free else "pro"}_cd')
        skill = SKILLS[skill_name]

        if skill['price'] > self.user.money_cash:
            raise OOEException('Not enough money')

        if cd_remaining is not None and cd_remaining > int(time.time()):
            raise OOEException('Skill training is on cooldown')

    def start_practice(self, skill_name: str):
        is_free = skill_name.endswith('_free')

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

        cooldown_sec = SKILL_COOLDOWNS["free" if is_free else "pro"]
        cd = int(time.time()) + cooldown_sec

        cache.set(f'user_{self.user.id}_training_{"free" if is_free else "pro"}_cd',
            cd,
            timeout = cooldown_sec)

        return {
                'points_gained': points_gained,
                'exp_gained': skill['exp_reward'],
                'cd_remaining': cd}