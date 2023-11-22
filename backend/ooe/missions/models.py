from django.core.cache import cache

cache.set('my_key', 'value')  # Set a key with a 5-minute expiry
print(cache.get('my_key'))  # Get the value back