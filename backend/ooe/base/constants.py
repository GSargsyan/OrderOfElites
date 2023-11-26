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

RANK_REQUIREMENTS = {
    'stakeout': 1,
    'recon_op': 2
}

MISSIONS = {
    'stakeout': {
        'name': 'Stakeout',
        'cooldown': 360, # 6 minutes
        'exp_reward': 100,
        'max_reward_rank': 6,
        'min_reward': 0,
        'max_reward': 1100,
        'random_range': 100,
    },
    'recon_op': {
        'name': 'Recon Op',
        'cooldown': 1200,  # 20 minutes
        'exp_reward': 20,
        'max_reward_rank': 10,
        'min_reward': 1000,
        'max_reward': 5000,
        'random_range': 500,
    }
}

'''
Training	Cooldown	Exp	Price	Points gains
Shooting	3m	3	$0	1
Racing	3m	3	$0	1
Defense	3m	3	$0	1
Pro Shooting	20m	10	$10,000	10
Pro Racing	20m	10	$5,000	10
Pro Defense	20m	10	$2,000	10
'''

SKILLS = {
    'attack_free': {
        'users_field': 'attack_points',
        'cooldown': 180,
        'exp_reward': 3,
        'points': 1,
        'price': 0,
    },
    'attack_pro': {
        'users_field': 'attack_points',
        'cooldown': 1200,
        'exp_reward': 10,
        'points': 10,
        'price': 10000,
    },
    'defense_free': {
        'users_field': 'defense_points',
        'cooldown': 180,
        'exp_reward': 3,
        'points': 1,
        'price': 0,
    },
    'defense_pro': {
        'users_field': 'defense_points',
        'cooldown': 1200,
        'exp_reward': 10,
        'points': 10,
        'price': 2000,
    },
    'driving_free': {
        'users_field': 'driving_points',
        'cooldown': 180,
        'exp_reward': 3,
        'points': 1,
        'price': 0,
    },
    'driving_pro': {
        'users_field': 'driving_points',
        'cooldown': 1200,
        'exp_reward': 10,
        'points': 10,
        'price': 5000,
    },
}


