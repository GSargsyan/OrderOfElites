from django.db import transaction

from rest_framework.decorators import api_view
from rest_framework.response import Response

from ooe.base.utils import auth_by_token
from ooe.missions.controllers import Missions, Mission
from ooe.base.exceptions import OOEException


@api_view(['POST'])
@auth_by_token
def get_missions_tab_data(request):
    print(Missions(user=request.user).get_missions_tab_data())
    return Response(Missions(user=request.user).get_missions_tab_data(), status=200)


@api_view(['POST'])
@auth_by_token
# @transaction.atomic
def start_mission(request, mission_name):
    try:
        return Response(
            Mission(mission_name, request.user).start(),
            status=200)
    except OOEException as e:
        return Response({
            'status': 'error',
            'message': str(e),
        }, status=400)
