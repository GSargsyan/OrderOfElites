# Login Bug Report: City.DoesNotExist Error

## Problem Description
Users cannot log in to the application and receive the following error:
```
ooe.cities.models.City.DoesNotExist: City matching query does not exist.
```

## Root Cause Analysis

### 1. Model Structure Issue
The bug occurs due to a design flaw in the User model (`backend/ooe/users/models.py`):

```python
class User(AbstractBaseUser):
    # ... other fields ...
    city = models.ForeignKey('cities.City', on_delete=models.CASCADE, default=1)
```

**Problem**: The User model has a foreign key to City with `default=1`, meaning it expects a City record with `id=1` to always exist in the database.

### 2. When the Error Occurs
The error is triggered during login when Django tries to access user city information in the following methods:

#### In `get_preview_data()` method (line 52):
```python
def get_preview_data(self):
    res = {
        'username': self.username,
        'city': self.city.name,  # ← Fails here if City id=1 doesn't exist
        # ... other fields
    }
```

#### In `add_default_chat_rooms()` method (line 62):
```python
def add_default_chat_rooms(self):
    chat_room = ChatRoom.objects.get(name=self.city.name)  # ← Also fails here
```

### 3. Data Initialization Issue
The application has a management command (`backend/ooe/base/management/commands/insert_initial_data.py`) that creates cities using `get_or_create()`:

```python
for city in cities:
    City.objects.get_or_create(name=city)
```

**Issue**: `get_or_create()` doesn't guarantee that the first city will have `id=1`. If cities are deleted and recreated, or if the database is reset, the first city might get a different ID.

## Impact
- **Complete login failure** for all users
- Users cannot access the application
- Database state dependency makes the system fragile

## Solutions

### Solution 1: Fix Default City Reference (Recommended)
Modify the User model to use a more robust default city mechanism:

```python
# In backend/ooe/users/models.py
class User(AbstractBaseUser):
    # Change from default=1 to a method that gets the first available city
    city = models.ForeignKey('cities.City', on_delete=models.CASCADE, null=True)
    
    def save(self, *args, **kwargs):
        if not self.city_id:
            # Get the first available city or create a default one
            from ooe.cities.models import City
            default_city, created = City.objects.get_or_create(
                name='Default City',
                defaults={'name': 'Default City'}
            )
            self.city = default_city
        super().save(*args, **kwargs)
```

### Solution 2: Ensure City ID=1 Always Exists
Modify the management command to guarantee a city with ID=1:

```python
# In backend/ooe/base/management/commands/insert_initial_data.py
def handle(self, *args, **kwargs):
    # Ensure city with ID=1 exists first
    default_city, created = City.objects.get_or_create(
        id=1,
        defaults={'name': 'Abu Dhabi'}
    )
    
    # Then create other cities
    cities = [
        'Hong Kong', 'Jakarta', 'London', 'Mexico City',
        'Moscow', 'New York', 'Paris', 'Rio de Janeiro',
        'Rome', 'Sydney', 'Tokyo',
    ]
    
    for city_name in cities:
        if city_name != default_city.name:  # Skip if already created
            City.objects.get_or_create(name=city_name)
```

### Solution 3: Add Defensive Programming
Add null checks in User model methods:

```python
def get_preview_data(self):
    res = {
        'username': self.username,
        'city': self.city.name if self.city else 'Unknown',
        # ... other fields
    }
    return res

def add_default_chat_rooms(self):
    if self.city:
        chat_room = ChatRoom.objects.get(name=self.city.name)
        chat_room.users.add(self)
```

## Immediate Fix
To resolve the issue immediately:

1. **Run the data initialization command**:
   ```bash
   python manage.py insert_initial_data
   ```

2. **Verify cities exist**:
   ```bash
   python manage.py shell -c "from ooe.cities.models import City; print([(c.id, c.name) for c in City.objects.all()])"
   ```

3. **Ensure city with ID=1 exists**:
   ```bash
   python manage.py shell -c "from ooe.cities.models import City; City.objects.get_or_create(id=1, defaults={'name': 'Abu Dhabi'})"
   ```

## Prevention
- Implement proper database seeding in deployment scripts
- Add database integrity checks
- Consider using Django fixtures for essential data
- Add unit tests to verify critical model relationships

## Files Affected
- `backend/ooe/users/models.py` (lines 27, 52, 62)
- `backend/ooe/cities/models.py`
- `backend/ooe/base/management/commands/insert_initial_data.py`

## Priority
**HIGH** - Prevents all user logins, complete system unusability.