from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password

@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response({"error": "Username and Password are required!"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already taken!"}, status=400)

    user = User.objects.create(username=username, password=make_password(password))

    return Response(status=201)
