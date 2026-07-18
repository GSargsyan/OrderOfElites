# solo missions startable via start_mission/<name> (extraction has its own flow)
SIMPLE_MISSIONS = ('stakeout', 'recon_op')

RANK_REQUIREMENTS = {
    'stakeout': 1,
    'recon_op': 2,
    'extraction': 5,
}

MISSIONS = {
    'stakeout': {
        'name': 'Stakeout',
        'cooldown': 360, # 6 minutes
        'exp_reward': 10,
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
        'min_reward': 10000,
        'max_reward': 20000,
        'random_range': 500,
    },
    'extraction': {
        'name': 'Extraction',
        'cooldown': 7200,  # 2 hours, applies to both participants
        'exp_reward': 150,  # both participants
        'reward': 100000,  # flat for now, goes to the initiator
        'invite_ttl': 600,  # invitations expire after 10 minutes
    },
}
