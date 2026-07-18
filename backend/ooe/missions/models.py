from django.db import models


class MissionLog(models.Model):
    mission = models.CharField(max_length=30)
    primary_user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='primary_user')
    reward = models.IntegerField(default=0)

    class Meta:
        db_table = 'ooe_mission_log'


class ExtractionMission(models.Model):
    INVITED = 'invited'
    ACCEPTED = 'accepted'
    READY = 'ready'
    COMPLETED = 'completed'
    REJECTED = 'rejected'
    CANCELLED = 'cancelled'
    EXPIRED = 'expired'

    STATUS_CHOICES = [
        (INVITED, 'Invited'),
        (ACCEPTED, 'Accepted'),
        (READY, 'Ready'),
        (COMPLETED, 'Completed'),
        (REJECTED, 'Rejected'),
        (CANCELLED, 'Cancelled'),
        (EXPIRED, 'Expired'),
    ]

    # statuses where the mission is still in play
    ACTIVE_STATUSES = [INVITED, ACCEPTED, READY]
    # statuses where the driver has actually joined
    JOINED_STATUSES = [ACCEPTED, READY]

    initiator = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='extractions_initiated')
    driver = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='extractions_driven')
    city = models.ForeignKey('cities.City', on_delete=models.CASCADE, related_name='extraction_missions')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=INVITED)
    car = models.CharField(max_length=50, null=True, blank=True)
    reward = models.IntegerField(default=0)
    exp_reward = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ooe_extraction_missions'
        indexes = [
            models.Index(fields=['initiator', 'status']),
            models.Index(fields=['driver', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]