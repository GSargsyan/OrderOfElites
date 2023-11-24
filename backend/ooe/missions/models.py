from django.db import models


class MissionLog(models.Model):
    mission = models.CharField(max_length=30)
    primary_user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='primary_user')
    reward = models.IntegerField(default=0)

    class Meta:
        db_table = 'ooe_mission_log'