from rest_framework.decorators import api_view
from rest_framework.response import Response

from ooe.chat.models import ChatConnection
from ooe.base.utils import authorize


@api_view(['POST'])
@authorize
def get_user_connections(request):
    import time
    time.sleep(1)

    print(request.user.chat_connections.all())

    res = [{'id': conn.chat_room.id,
           'name': conn.chat_room.name
           } for conn in request.user.chat_connections.all()
    ]

    return Response(res, status=200)