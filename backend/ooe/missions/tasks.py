from datetime import timedelta

from celery import shared_task
from django.utils import timezone


@shared_task
def expire_extraction_invitations():
    """
    Marks dangling Extraction invitations as expired, so a driver arriving
    in the city later doesn't see stale invites.
    """
    from ooe.missions.models import ExtractionMission
    from ooe.missions.constants import MISSIONS

    cutoff = timezone.now() - timedelta(seconds=MISSIONS['extraction']['invite_ttl'])
    ExtractionMission.objects.filter(
        status=ExtractionMission.INVITED,
        created_at__lt=cutoff,
    ).update(status=ExtractionMission.EXPIRED, updated_at=timezone.now())
