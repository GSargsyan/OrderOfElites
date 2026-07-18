import re
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from django.http import JsonResponse
from django.contrib.auth import authenticate, login
from django.contrib.auth.hashers import make_password

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.authtoken.models import Token
from ooe.base.utils import auth_by_token

from ooe.base.exceptions import OOEException
from ooe.users.models import User
from ooe.users.controllers import SkillsController, UserReviewsController
from ooe.users.constants import \
    USERNAME_REGEX, \
    USERNAME_LEN_MAX, \
    USERNAME_LEN_MIN, \
    PASSWORD_REGEX, \
    PASSWORD_LEN_MIN, \
    PASSWORD_LEN_MAX


@api_view(['POST'])
@auth_by_token
def get_preview(request):
    user = request.user

    return Response(user.get_preview_data(), status=200)


@api_view(['POST'])
@auth_by_token
def get_skills_tab_data(request):
    return Response(SkillsController(request.user).get_skills_tab_data(), status=200)


@api_view(['POST'])
@auth_by_token
def find_by_username(request):
    username = request.data.get("username")

    if not username:
        return Response({"error": "Username is required"}, status=400)

    try:
        return Response(User.objects.get(username=username).get_profile_data(requesting_user=request.user), status=200)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)


@api_view(['POST'])
@auth_by_token
def add_review(request):
    reviewed_username = request.data.get("reviewed_username")
    rating = request.data.get("rating")
    text = request.data.get("text")

    try:
        controller = UserReviewsController(request.user)
        profile_data = controller.add_review(reviewed_username, rating, text)
        return Response(profile_data, status=201)
    except OOEException as e:
        return Response({
            'status': 'error',
            'message': str(e),
        }, status=400)



@api_view(['POST'])
@auth_by_token
@transaction.atomic
def start_skill_practice(request, skill_name):
    try:
        return Response(
            SkillsController(request.user).start_practice(skill_name),
            status=200)
    except OOEException as e:
        return Response({
            'status': 'error',
            'message': str(e),
        }, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get("username")
    password = request.data.get("password")
    user = authenticate(request, username=username, password=password)

    if user is not None:
        user.last_login_time = timezone.now()
        user.save(update_fields=['last_login_time'])
        token, created = Token.objects.get_or_create(user=user)
        user.add_default_chat_rooms()
        resp = Response({'token': token.key}, status=200)
    else:
        resp = Response({"error": "Incorrect Username/Password combination"},
            status=401)

    return resp


@api_view(['POST'])
@permission_classes([AllowAny])
@transaction.atomic
def signup_user(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response({"error": "Username and Password are required"},
            status=400)

    if len(username) < USERNAME_LEN_MIN:
        return Response({"error": "Username should be at least "
            f"{USERNAME_LEN_MIN} characters long"}, status=400)

    if len(username) > USERNAME_LEN_MAX:
        return Response({"error": "Username should be at most "
            f"{USERNAME_LEN_MAX} characters long"}, status=400)

    if not re.match(USERNAME_REGEX, username):
        return Response({"error": "Username can only include letters and underscores"},
            status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already taken"},
            status=400)

    if len(password) < PASSWORD_LEN_MIN:
        return Response({"error": "Password should be at least "
            f"{PASSWORD_LEN_MIN} characters long"}, status=400)

    if len(password) > PASSWORD_LEN_MAX:
        return Response({"error": "Password should be at most "
            f"{PASSWORD_LEN_MAX} characters long"}, status=400)

    if not re.match(PASSWORD_REGEX, password):
        return Response({"error": "Password can only contain latin letters, "
            "numbers and !@#$%^&*() special characters"}, status=400)


    user = User.objects.create(username=username, password=make_password(password))
    user.last_login_time = timezone.now()
    user.save(update_fields=['last_login_time'])
    Token.objects.create(user=user)

    user.add_default_chat_rooms()

    return Response(status=201)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_homepage_stats(request):
    total_registrations = User.objects.count()
    
    # Calculate online now (within last 15 mins) and online 24h
    now = timezone.now()
    fifteen_mins_ago = now - timedelta(minutes=15)
    one_day_ago = now - timedelta(hours=24)

    # We use updated_at to track activity since login is just one action
    online_now = User.objects.filter(updated_at__gte=fifteen_mins_ago).count()
    online_24h = User.objects.filter(updated_at__gte=one_day_ago).count()

    return Response({
        'total_registrations': total_registrations,
        'online_now': online_now,
        'online_24h': online_24h,
    }, status=200)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_top_elites(request):
    top_users = User.objects.order_by('-rank', '-exp')[:10]
    data = []
    for user in top_users:
        data.append({
            'username': user.username,
            'rank': user.rank,
            'exp': user.exp,
        })
    return Response({'top_elites': data}, status=200)
