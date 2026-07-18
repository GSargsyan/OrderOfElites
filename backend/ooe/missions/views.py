from django.db import transaction

from rest_framework.decorators import api_view
from rest_framework.response import Response

from ooe.base.utils import auth_by_token
from ooe.base.exceptions import OOEException
from ooe.missions.controllers import MissionsController, Mission, ExtractionController


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


@api_view(['POST'])
@auth_by_token
def extraction_action(request, action):
    controller = ExtractionController(request.user)

    try:
        if action == 'invite':
            result = controller.invite(request.data.get('username'))
        elif action == 'ready':
            result = controller.ready(request.data.get('mission_id'), request.data.get('car'))
        elif action in ('accept', 'reject', 'unready', 'cancel', 'start'):
            result = getattr(controller, action)(request.data.get('mission_id'))
        else:
            raise OOEException('Unknown action')

        return Response(result, status=200)
    except OOEException as e:
        return Response({
            'status': 'error',
            'message': str(e),
        }, status=400)
