from django.db import transaction

from rest_framework.decorators import api_view
from rest_framework.response import Response
from ooe.base.utils import auth_by_token

from ooe.base.exceptions import OOEException
from ooe.black_market.controllers import BlackMarketController


@api_view(['POST'])
@auth_by_token
def get_tab_data(request):
    return Response(
        BlackMarketController(request.user).get_tab_data(),
        status=200)


@api_view(['POST'])
@auth_by_token
@transaction.atomic
def buy_precursor(request):
    try:
        return Response(
            BlackMarketController(request.user).buy_precursor(
                drug_type=request.data.get('drug_type'),
            ),
            status=200)
    except OOEException as e:
        return Response({
            'status': 'error',
            'message': str(e),
        }, status=400)


@api_view(['POST'])
@auth_by_token
@transaction.atomic
def assign_professional(request):
    try:
        return Response(
            BlackMarketController(request.user).assign_professional(
                drug_type=request.data.get('drug_type'),
                role=request.data.get('role'),
            ),
            status=200)
    except OOEException as e:
        return Response({
            'status': 'error',
            'message': str(e),
        }, status=400)


@api_view(['POST'])
@auth_by_token
@transaction.atomic
def remove_professional(request):
    try:
        return Response(
            BlackMarketController(request.user).remove_professional(
                drug_type=request.data.get('drug_type'),
                role=request.data.get('role'),
            ),
            status=200)
    except OOEException as e:
        return Response({
            'status': 'error',
            'message': str(e),
        }, status=400)


@api_view(['POST'])
@auth_by_token
@transaction.atomic
def withdraw_money(request):
    try:
        return Response(
            BlackMarketController(request.user).withdraw_money(
                drug_type=request.data.get('drug_type'),
            ),
            status=200)
    except OOEException as e:
        return Response({
            'status': 'error',
            'message': str(e),
        }, status=400)
