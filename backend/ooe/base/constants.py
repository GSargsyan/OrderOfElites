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
        'exp_reward': 10,
        'money_reward_range': (500, 1000)
    },
    'recon_op': {
        'name': 'Recon Op',
        'cooldown': 1200,  # 20 minutes
        'exp_reward': 20,
        'money_reward_range': (1000, 3000)
    }
}