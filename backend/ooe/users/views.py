import re

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate, login

from ooe.users.models import User
from ooe.users.constants import \
    USERNAME_REGEX, \
    USERNAME_LEN_MAX, \
    USERNAME_LEN_MIN, \
    PASSWORD_REGEX, \
    PASSWORD_LEN_MIN, \
    PASSWORD_LEN_MAX


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get("username")
    password = request.data.get("password")
    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        return Response(status=200)
    else:
        return Response({"error": "Incorrect Username, password combination"},
            status=401)


@api_view(['POST'])
@permission_classes([AllowAny])
def signup_user(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response({"error": "Username and Password are required"},
            status=400)

    if len(username) < USERNAME_LEN_MIN:
        return Response({"error": "Username should be at least "\
            f"{USERNAME_LEN_MIN} characters long"}, status=400)

    if len(username) > USERNAME_LEN_MAX:
        return Response({"error": "Username should be at most "\
            f"{USERNAME_LEN_MAX} characters long"}, status=400)

    if not re.match(USERNAME_REGEX, username):
        return Response({"error": "Username can only include letters and underscores"},
            status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already taken"},
            status=400)

    if len(password) < PASSWORD_LEN_MIN:
        return Response({"error": "Password should be at least "\
            f"{PASSWORD_LEN_MIN} characters long"}, status=400)

    if len(password) > PASSWORD_LEN_MAX:
        return Response({"error": "Password should be at most "\
            f"{PASSWORD_LEN_MAX} characters long"}, status=400)

    if not re.match(PASSWORD_REGEX, password):
        return Response({"error": "Password should consist of latin letters, numbers " \
            "and underscores"}, status=400)

    if not re.match(PASSWORD_REGEX, password):
        return Response({"error": "Password can only contain latin letters, " \
            "numbers and special characters"}, status=400)
        
    user = User.objects.create(username=username, password=make_password(password))

    return Response(status=201)
