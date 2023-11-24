from django.db import transaction

from rest_framework.decorators import api_view
from rest_framework.response import Response

from ooe.base.utils import auth_by_token
from ooe.missions.controllers import Missions


@api_view(['POST'])
@auth_by_token
def get_missions_tab_data(request):
    import time
    time.sleep(1)

    return Response(Missions(user=request.user).get_missions_tab_data(), status=200)


@api_view(['POST'])
@auth_by_token
# @transaction.atomic
def start_mission(request):
    import time
    time.sleep(1)

    mission = request.POST.get('mission_name')
    try:
        Mission(mission, request.user).start()
    except OOEException as e:
        return Response({
            'status': 'error',
            'message': str(e),
        }, status=400)

    return Response(
        status=200)