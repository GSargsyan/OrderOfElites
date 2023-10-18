from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models


'''
class UserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError("The Username field must be set")

        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)

        return user
'''


class User(AbstractBaseUser):
    username = models.CharField(max_length=30, unique=True)
    email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)
    money_cash = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    money_bank = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    city_id = models.ForeignKey('cities.City', on_delete = models.CASCADE)

    '''
    objects = UserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = []
    '''
