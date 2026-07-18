RANK_EXPS = {
    1: 0,
    2: 296,
    3: 1000,
    4: 2228,
    5: 4630,
    6: 8000,
    7: 12533,
    8: 18328,
    9: 25481,
    10: 34080,
    11: 44213,
    12: 55968,
    13: 69433,
    14: 84696,
    15: 101845,
    16: 120968,
    17: 142153,
    18: 165488,
    19: 191061,
    20: 218960,
    21: 249273,
    22: 282088,
    23: 317493,
    24: 355576,
    25: 396425,
    26: 440128,
    27: 486773,
    28: 536448,
    29: 589241,
    30: 645240
}

SKILL_COOLDOWNS = {
    'free': 180,  # 3 minutes
    'pro': 1200,  # 20 minutes
}

SKILLS = {
    'attack_free': {
        'users_field': 'attack_points',
        'exp_reward': 3,
        'points': 1,
        'price': 0,
    },
    'attack_pro': {
        'users_field': 'attack_points',
        'exp_reward': 10,
        'points': 10,
        'price': 10000,
    },
    'defense_free': {
        'users_field': 'defense_points',
        'exp_reward': 3,
        'points': 1,
        'price': 0,
    },
    'defense_pro': {
        'users_field': 'defense_points',
        'exp_reward': 10,
        'points': 10,
        'price': 2000,
    },
    'driving_free': {
        'users_field': 'driving_points',
        'exp_reward': 3,
        'points': 1,
        'price': 0,
    },
    'driving_pro': {
        'users_field': 'driving_points',
        'exp_reward': 10,
        'points': 10,
        'price': 5000,
    },
}

ITEM_SELL_PERCENT = .75

# the exact realistic times to wait in game will be frustrating,
# so let's divide the realistic times by this number
TRAVEL_TIME_REDUCER = 2.32

TRAVEL_ROUTES = {
    'New York': {
        'Mexico City': {
            'time_minutes': 240,
            'cost': 3500
        },
        'Moscow': {
            'time_minutes': 540,
            'cost': 7500
        },
        'Rome': {
            'time_minutes': 480,
            'cost': 6900
        },
    },
    'Mexico City': {
        'New York': {
            'time_minutes': 240,
            'cost': 3500
        },
        'Moscow': {
            'time_minutes': 750,
            'cost': 10700
        },
        'Rome': {
            'time_minutes': 720,
            'cost': 10200
        },
    },
    'Moscow': {
        'New York': {
            'time_minutes': 540,
            'cost': 7500
        },
        'Mexico City': {
            'time_minutes': 750,
            'cost': 10700
        },
        'Rome': {
            'time_minutes': 210,
            'cost': 2400
        },
    },
    'Rome': {
        'New York': {
            'time_minutes': 480,
            'cost': 6900
        },
        'Mexico City': {
            'time_minutes': 720,
            'cost': 10200
        },
        'Moscow': {
            'time_minutes': 210,
            'cost': 2400
        },
    }
}