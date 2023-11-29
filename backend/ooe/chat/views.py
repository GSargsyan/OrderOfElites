from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.authtoken.models import Token

from ooe.base.utils import auth_by_token
from ooe.chat.models import \
    ChatRoom, \
    Message
from ooe.users.models import User


@api_view(['POST'])
@auth_by_token
def get_user_rooms(request):
    res = [{
        'id': room.id,
        'name': room.name,
    } for room in ChatRoom.objects.filter(users=request.user).exclude(chat_type ='direct')]

    return Response(res, status=200)


@api_view(['POST'])
@auth_by_token
def get_dm_conversations(request):
    return Response(ChatRoom.get_dm_conversations(request.user.id), status=200)


@api_view(['POST'])
@auth_by_token
def get_dm_messages(request):
    requester = request.user

    conv_username = request.data.get("username")
    conv_user = User.objects.get(username=conv_username)

    return Response(Message.get_dm_messages(requester, conv_user), status=200)


@api_view(['POST'])
def authenticate_connection(request):
    room_id = request.data.get("room_id")
    token = request.data.get("token")

    user = Token.objects.get(key=token).user

    if user is None:
        return Response({"error": "Invalid token"}, status=401)

    if not ChatRoom.objects.filter(id=room_id, users=user).exists():
        return Response({"error": "User is not authorized to join this chat"}, status=401)

    return Response({"success": "Token verified",
                     "username": user.username}, status=200)