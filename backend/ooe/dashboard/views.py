from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.authtoken.models import Token

from ooe.users.models import User
from ooe.base.utils import authorize


@api_view(['POST'])
@authorize
def get_dashboard_params(request):
    import time
    time.sleep(1)
    user = request.user

    return Response(user.get_user_dash(), status=200)