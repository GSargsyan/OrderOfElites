import json
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.authtoken.models import Token

from ooe.base.utils import auth_by_token
from ooe.chat.models import ChatRoom, Message
from ooe.users.models import User

import redis

redis_client = redis.Redis(host='redis', port=6379, db=0)


@api_view(['POST'])
@auth_by_token
def get_user_rooms(request):
    res = [{
        'id': room.id,
        'name': room.name,
        'chat_type': room.chat_type,
    } for room in ChatRoom.objects.filter(users=request.user).exclude(chat_type='direct')]

    return Response(res, status=200)


@api_view(['POST'])
@auth_by_token
def get_dm_conversations(request):
    conversations = ChatRoom.get_dm_conversations(request.user)
    return Response(conversations, status=200)


@api_view(['POST'])
@auth_by_token
def get_dm_messages(request):
    conv_username = request.data.get('username')
    before_id = request.data.get('before_id')

    try:
        conv_user = User.objects.get(username=conv_username)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

    messages = Message.get_dm_messages(
        request.user, conv_user,
        before_id=before_id,
        limit=50
    )

    return Response(messages, status=200)


@api_view(['POST'])
@auth_by_token
def send_dm(request):
    recipient_username = request.data.get('username')
    message_text = request.data.get('message', '').strip()

    if not message_text:
        return Response({'error': 'Message cannot be empty'}, status=400)

    if len(message_text) > 500:
        return Response({'error': 'Message too long (max 500 characters)'}, status=400)

    try:
        recipient = User.objects.get(username=recipient_username)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

    if recipient.id == request.user.id:
        return Response({'error': 'Cannot message yourself'}, status=400)

    # Find or create the DM room
    room = ChatRoom.get_or_create_dm_room(request.user, recipient)

    # Save the message
    msg = Message.objects.create(
        chat_room=room,
        user=request.user,
        message=message_text,
    )

    msg_data = {
        'id': msg.id,
        'room_id': room.id,
        'username': request.user.username,
        'message': msg.message,
        'created_at': msg.created_at.isoformat(),
    }

    # Publish to Redis so Node can push to recipient in real-time
    redis_client.publish(
        f'dm_message:{recipient.id}',
        json.dumps(msg_data)
    )

    # Also publish to sender (for multi-tab sync)
    redis_client.publish(
        f'dm_message:{request.user.id}',
        json.dumps(msg_data)
    )

    return Response(msg_data, status=201)


@api_view(['POST'])
@auth_by_token
def get_city_messages(request):
    room_id = request.data.get('room_id')
    before_id = request.data.get('before_id')

    if not room_id:
        return Response({'error': 'room_id is required'}, status=400)

    # Verify user has access to this room
    if not ChatRoom.objects.filter(id=room_id, users=request.user).exists():
        return Response({'error': 'Not authorized'}, status=403)

    messages = Message.get_city_messages(
        room_id,
        before_id=before_id,
        limit=50
    )

    return Response(messages, status=200)


@api_view(['POST'])
@auth_by_token
def send_city_message(request):
    room_id = request.data.get('room_id')
    message_text = request.data.get('message', '').strip()

    if not message_text:
        return Response({'error': 'Message cannot be empty'}, status=400)

    if len(message_text) > 100:
        return Response({'error': 'Message too long (max 100 characters)'}, status=400)

    if not room_id:
        return Response({'error': 'room_id is required'}, status=400)

    # Verify user has access and room is a city chat
    try:
        room = ChatRoom.objects.get(id=room_id, users=request.user)
    except ChatRoom.DoesNotExist:
        return Response({'error': 'Not authorized'}, status=403)

    if room.chat_type != 'city':
        return Response({'error': 'Not a city chat room'}, status=400)

    # Save the message
    msg = Message.objects.create(
        chat_room=room,
        user=request.user,
        message=message_text,
    )

    msg_data = {
        'id': msg.id,
        'room_id': room.id,
        'username': request.user.username,
        'message': msg.message,
        'created_at': msg.created_at.isoformat(),
    }

    # Publish to Redis so Node can broadcast to city room
    redis_client.publish(
        f'city_message:{room.id}',
        json.dumps(msg_data)
    )

    return Response(msg_data, status=201)


@api_view(['POST'])
@auth_by_token
def mark_messages_read(request):
    """Mark all messages from the other user in a DM conversation as read."""
    conv_username = request.data.get('username')

    try:
        conv_user = User.objects.get(username=conv_username)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

    # Find the DM room
    common_rooms = ChatRoom.objects.filter(
        chat_type='direct',
        users=request.user
    ).filter(
        users=conv_user
    )

    if not common_rooms.exists():
        return Response({'ok': True}, status=200)

    # Mark unread messages from the other user as read
    Message.objects.filter(
        chat_room__in=common_rooms,
        user=conv_user,
        read_at__isnull=True
    ).update(read_at=timezone.now())

    return Response({'ok': True}, status=200)


@api_view(['POST'])
def authenticate_connection(request):
    room_id = request.data.get('room_id')
    token = request.data.get('token')

    try:
        user = Token.objects.get(key=token).user
    except Token.DoesNotExist:
        return Response({'error': 'Invalid token'}, status=401)

    if user is None:
        return Response({'error': 'Invalid token'}, status=401)

    if room_id:
        if not ChatRoom.objects.filter(id=room_id, users=user).exists():
            return Response({'error': 'User is not authorized to join this chat'}, status=401)

    return Response({
        'success': 'Token verified',
        'username': user.username,
        'user_id': user.id,
    }, status=200)