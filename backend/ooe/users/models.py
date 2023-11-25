from django.db import models
from django.db.models import F
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

from ooe.chat.models import ChatConnection, ChatRoom
from ooe.base.constants import RANK_EXPS


class UserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError("The Username field must be set")

        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)

        return user


class User(AbstractBaseUser):
    username = models.CharField(max_length=30, unique=True)
    email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    money_cash = models.IntegerField(default=0)
    money_bank = models.IntegerField(default=0)
    city = models.ForeignKey('cities.City', on_delete=models.CASCADE, default=1)
    exp = models.IntegerField(default=0)
    rank = models.IntegerField(default=1)

    objects = UserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'ooe_users'

    def get_rank_progress(self):
        next_rank_exp = RANK_EXPS[self.rank + 1]
        curr_rank_exp = RANK_EXPS[self.rank]

        abs_diff = next_rank_exp - curr_rank_exp
        exp_passed = self.exp - curr_rank_exp

        progress = (exp_passed / abs_diff) * 100

        return progress

    def get_preview_data(self):
        res = {
            'username': self.username,
            'city': self.city.name,
            'money_cash': self.money_cash,
            'rank': self.rank,
            'rank_progress': self.get_rank_progress()
        }

        return res

    def add_default_chat_rooms(self):
        chat_rooms = ChatRoom.objects.get(name=self.city.name)

        ChatConnection.objects.create(user=self, chat_room=chat_rooms)

    def add_exp(self, exp: int):
        User.objects.filter(id=self.id).update(exp=F('exp') + exp)

        self.refresh_from_db()

        # Update rank if needed
        if self.exp >= RANK_EXPS[self.rank + 1]:
            self.rank += 1
            self.save(update_fields=['rank'])