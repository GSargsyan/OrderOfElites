from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.authtoken.models import Token

from ooe.chat.models import ChatConnection
from ooe.base.utils import auth_by_token


@api_view(['POST'])
@auth_by_token
def get_user_connections(request):
    res = [{
        'id': conn.chat_room.id,
        'name': conn.chat_room.name
        } for conn in request.user.chat_connections.all()
    ]

    return Response(res, status=200)


@api_view(['POST'])
def authenticate_connection(request):
    room_id = request.data.get("room_id")
    token = request.data.get("token")

    user = Token.objects.get(key=token).user

    if user is None:
        return Response({"error": "Invalid token"}, status=401)

    connection = ChatConnection.objects.filter(chat_room__id=room_id, user=user).first()

    if not connection:
        return Response({"error": "User is not authorized to join this chat"}, status=401)

    return Response({"success": "Token verified"}, status=200)
