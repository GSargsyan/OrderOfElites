# ── Professionals ──────────────────────────────────────────────
PROFESSIONALS_BASE_COUNT = 10       # Max professionals at Rank 1
PROFESSIONALS_PER_RANK = 5          # Additional slots per rank above 1
PROFESSIONALS_MAX = 160             # Hard cap regardless of rank
TRAINING_TIME_MINUTES = 0.1  # testing at 0.1 # 60          # Minutes to train a new professional

# ── Rank Requirements ─────────────────────────────────────────
RANK_REQUIREMENTS = {
    'alcohol': 1,
    'cannabis': 5,
    'methamphetamine': 8,
    'cocaine': 12,
}

# ── Precursor Prices (cost per 1 kg / 1 unit) ────────────────
PRECURSOR_PRICES = {
    'alcohol': 400,
    'cannabis': 1000,
    'methamphetamine': 5000,
    'cocaine': 15000,
}

PRECURSOR_NAMES = {
    'alcohol': 'Grain',
    'cannabis': 'Seed',
    'methamphetamine': 'Meth Precursors',
    'cocaine': 'Coca Leaves',
}

# ── Precursor Bulk Buy ────────────────────────────────────────
# Whitelisted quantities for buy_precursor (1 = default, 5 = shift, 100 = ctrl)
PRECURSOR_BUY_QUANTITIES = {1, 5, 100}

# ── Production Chains ─────────────────────────────────────────
# Each drug type has an ordered list of steps.
# The final step (produces_to=None) generates money instead of material.
PRODUCTION_CHAINS = {
    'alcohol': {
        'steps': [
            {
                'role': 'brewer',
                'label': 'Brewer',
                'consumes_from': 'precursor_qty',
                'produces_to': 'intermediate_1_qty',
                'consume_rate': 7,      # kg grain per hour per professional
                'produce_rate': 4,      # liters alcohol per hour per professional
            },
            {
                'role': 'distributor',
                'label': 'Distributor',
                'consumes_from': 'intermediate_1_qty',
                'produces_to': 'stash_qty',
                'consume_rate': 11,
                'produce_rate': 11,
            },
        ],
    },
    'cannabis': {
        'steps': [
            {
                'role': 'botanist',
                'label': 'Botanist',
                'consumes_from': 'precursor_qty',
                'produces_to': 'intermediate_1_qty',
                'consume_rate': 3,      # kg seed per hour
                'produce_rate': 13,     # kg leaves per hour
            },
            {
                'role': 'trimmer',
                'label': 'Trimmer',
                'consumes_from': 'intermediate_1_qty',
                'produces_to': 'intermediate_2_qty',
                'consume_rate': 7,      # kg leaves per hour
                'produce_rate': 4,      # kg cannabis per hour
            },
            {
                'role': 'dealer',
                'label': 'Dealer',
                'consumes_from': 'intermediate_2_qty',
                'produces_to': 'stash_qty',
                'consume_rate': 9,
                'produce_rate': 9,
            },
        ],
    },
    'methamphetamine': {
        'steps': [
            {
                'role': 'chemist',
                'label': 'Chemist',
                'consumes_from': 'precursor_qty',
                'produces_to': 'intermediate_1_qty',
                'consume_rate': 10,
                'produce_rate': 15,
            },
            {
                'role': 'cook',
                'label': 'Cook',
                'consumes_from': 'intermediate_1_qty',
                'produces_to': 'intermediate_2_qty',
                'consume_rate': 10,
                'produce_rate': 5,
            },
            {
                'role': 'crystalizer',
                'label': 'Crystalizer',
                'consumes_from': 'intermediate_2_qty',
                'produces_to': 'intermediate_3_qty',
                'consume_rate': 8,
                'produce_rate': 4,
            },
            {
                'role': 'meth_dealer',
                'label': 'Dealer',
                'consumes_from': 'intermediate_3_qty',
                'produces_to': 'stash_qty',
                'consume_rate': 12,
                'produce_rate': 12,
            },
        ],
    },
    'cocaine': {
        'steps': [
            {
                'role': 'picker',
                'label': 'Picker',
                'consumes_from': 'precursor_qty',
                'produces_to': 'intermediate_1_qty',
                'consume_rate': 20,
                'produce_rate': 10,
            },
            {
                'role': 'paste_maker',
                'label': 'Paste Maker',
                'consumes_from': 'intermediate_1_qty',
                'produces_to': 'intermediate_2_qty',
                'consume_rate': 10,
                'produce_rate': 5,
            },
            {
                'role': 'refiner',
                'label': 'Refiner',
                'consumes_from': 'intermediate_2_qty',
                'produces_to': 'intermediate_3_qty',
                'consume_rate': 8,
                'produce_rate': 4,
            },
            {
                'role': 'coke_dealer',
                'label': 'Dealer',
                'consumes_from': 'intermediate_3_qty',
                'produces_to': 'stash_qty',
                'consume_rate': 15,
                'produce_rate': 15,
            },
        ],
    },
}

# ── Pricing Formula ───────────────────────────────────────────
#
# Price per unit = B * [ (P * A) / ( (P * A) + S ) ] * R
#
# B = Base price of the drug
# P = Population (unique players logged in within last POPULATION_LOOKBACK_HOURS)
# A = Market price fluctuation absorber (higher value = more price stability)
# S = Supply (total units sold in this city in the last SUPPLY_WINDOW_MINUTES)
# R = Random noise multiplier (between NOISE_MIN and NOISE_MAX)
#
# When S is 0 (no supply), price ≈ B * R (base price with noise).
# As S grows, price decreases — incentivizing players to fight over cities.
# Higher A values make the drug more resistant to supply-driven price drops.
#
BASE_PRICES = {
    'alcohol': 1000,
    'cannabis': 8000,
    'methamphetamine': 20000,
    'cocaine': 40000,
}

PRICE_ABSORBER = {
    'alcohol': 50,
    'cannabis': 10,
    'methamphetamine': 5,
    'cocaine': 3,
}

# Min/max price bounds (prevent prices from going unreasonably low or high)
PRICE_MIN = {
    'alcohol': 200,
    'cannabis': 1600,
    'methamphetamine': 4000,
    'cocaine': 8000,
}

PRICE_MAX = {
    'alcohol': 2000,
    'cannabis': 16000,
    'methamphetamine': 40000,
    'cocaine': 80000,
}

POPULATION_LOOKBACK_HOURS = 24
SUPPLY_WINDOW_MINUTES = 1440  # 24 hours
NOISE_MIN = 0.92
NOISE_MAX = 1.08

# ── Tick Intervals ────────────────────────────────────────────
PRODUCTION_TICK_SECONDS = 10        # How often production is calculated
PRICE_TICK_SECONDS = 60             # How often prices recalculate

# ── Derived Helpers ───────────────────────────────────────────
# All valid professional roles across all drug types
ALL_ROLES = set()
ROLE_TO_DRUG_TYPE = {}
for _drug_type, _chain in PRODUCTION_CHAINS.items():
    for _step in _chain['steps']:
        ALL_ROLES.add(_step['role'])
        ROLE_TO_DRUG_TYPE[_step['role']] = _drug_type

DRUG_TYPES = list(PRODUCTION_CHAINS.keys())
