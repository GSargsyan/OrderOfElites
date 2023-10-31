from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models

from ooe.chat.models import ChatConnection, ChatRoom


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
    money_cash = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    money_bank = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    city = models.ForeignKey('cities.City', on_delete=models.CASCADE, default=1)

    objects = UserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'ooe_users'

    def get_preview_data(self):
        res = {
            'username': self.username,
            'city': self.city.name,
            'money_cash': self.money_cash,
        }

        return res

    def add_default_chat_rooms(self):
        chat_rooms = ChatRoom.objects.get(name=self.city.name)

        ChatConnection.objects.create(user=self, chat_room=chat_room)
