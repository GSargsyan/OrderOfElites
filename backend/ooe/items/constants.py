HOUSE_SELL_PERCENT = .90
CAR_SELL_PERCENT = .90
GUN_SELL_PERCENT = .90
AIRPLANE_SELL_PERCENT = .90

HOUSES = {
    'studio_apartment': {
        'name': 'Studio Apartment',
        'price': 100000,
        'defense_multiplier': 1.5,
        'garage_capacity': 1,
        'maintenance_cost': 1000,
    },
    'luxury_condo': {
        'name': 'Luxury Condo',
        'price': 1000000,
        'defense_multiplier': 2,
        'garage_capacity': 2,
        'maintenance_cost': 10000,
    },
    'mansion_estate': {
        'name': 'Mansion Estate',
        'price': 20000000,
        'defense_multiplier': 5,
        'garage_capacity': 4,
        'maintenance_cost': 100000,
    },
}

AIRPLANES = {
    'commercial_flight': {
        'name': 'Commercial Flight',
        'price': 0,
        'speed_multiplier': 1.0,
        'price_multiplier': 1.0,
        'cooldown': '3h',
        'cooldown_minutes': 180,
    },
    'corvus': {
        'name': 'Corvus',
        'price': 7500000,
        'speed_multiplier': 2.5,
        'price_multiplier': 2.0,
        'cooldown': '1h 45m',
        'cooldown_minutes': 105,
    },
    'mach_iv': {
        'name': 'Mach IV',
        'price': 50000000,
        'speed_multiplier': 5.0,
        'price_multiplier': 5.0,
        'cooldown': '45m',
        'cooldown_minutes': 45,
    },
    'sentinelle': {
        'name': 'Sentinelle',
        'price': 200000000,
        'speed_multiplier': 10.0,
        'price_multiplier': 20.0,
        'cooldown': '15m',
        'cooldown_minutes': 15,
    },
}