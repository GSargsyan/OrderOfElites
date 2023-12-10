from django.db import transaction

from rest_framework.decorators import api_view
from rest_framework.response import Response

from ooe.base.utils import auth_by_token
from ooe.base.exceptions import OOEException
from ooe.missions.controllers import MissionsController, Mission


@api_view(['POST'])
@auth_by_token
def get_missions_tab_data(request):
    return Response(
        MissionsController(user=request.user).get_missions_tab_data(),
        status=200)


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
