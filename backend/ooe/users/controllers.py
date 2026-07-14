import time

from django.core.cache import cache
from django.db.models import F

from ooe.users.models import User, UserReview
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


class UserReviewsController:
    def __init__(self, user: User):
        self.user = user  # The reviewer

    def add_review(self, reviewed_username: str, rating: int, text: str):
        try:
            reviewed_user = User.objects.get(username=reviewed_username)
        except User.DoesNotExist:
            raise OOEException("User not found")

        if self.user == reviewed_user:
            raise OOEException("You cannot write a review for yourself")

        try:
            rating_val = int(rating)
            if not (1 <= rating_val <= 5):
                raise ValueError()
        except (ValueError, TypeError):
            raise OOEException("Rating must be an integer between 1 and 5")

        text = (text or "").strip()
        if not text:
            raise OOEException("Review text cannot be empty")
        if len(text) > 250:
            raise OOEException("Review text must be at most 250 characters")

        from datetime import timedelta
        from django.utils import timezone
        one_day_ago = timezone.now() - timedelta(hours=24)

        last_review = UserReview.objects.filter(
            reviewer=self.user,
            reviewed=reviewed_user,
            created_at__gt=one_day_ago
        ).order_by('-created_at').first()

        if last_review:
            elapsed = timezone.now() - last_review.created_at
            remaining = int(86400 - elapsed.total_seconds())
            hours = remaining // 3600
            minutes = (remaining % 3600) // 60
            raise OOEException(f"You must wait {hours} hours and {minutes} minutes before reviewing this operative again")

        UserReview.objects.create(
            reviewer=self.user,
            reviewed=reviewed_user,
            rating=rating_val,
            text=text
        )

        return reviewed_user.get_profile_data(requesting_user=self.user)