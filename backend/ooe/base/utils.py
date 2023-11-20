from functools import wraps
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework import status


def auth_by_token(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        # Get the token from headers (or wherever you store it)
        token_key = request.headers.get('Authorization', '').split(' ')[-1]

        try:
            token = Token.objects.get(key=token_key)
            request.user = token.user
        except Token.DoesNotExist:
            return Response({"error": "Unauthorized"},
                            status=status.HTTP_401_UNAUTHORIZED)

        return view_func(request, *args, **kwargs)

    return _wrapped_view