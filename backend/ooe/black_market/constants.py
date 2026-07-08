# ── Professionals ──────────────────────────────────────────────
PROFESSIONALS_BASE_COUNT = 10       # Max professionals at Rank 1
PROFESSIONALS_PER_RANK = 5          # Additional slots per rank above 1
PROFESSIONALS_MAX = 160             # Hard cap regardless of rank
TRAINING_TIME_MINUTES = 0.1  # testing at 0.1 # 60          # Minutes to train a new professional

# ── Rank Requirements ─────────────────────────────────────────
RANK_REQUIREMENTS = {
    'alcohol': 1,
    'cannabis': 5,
}

# ── Precursor Prices (cost per 1 kg / 1 unit) ────────────────
PRECURSOR_PRICES = {
    'alcohol': 40,      # $40 per kg grain
    'cannabis': 100,    # $100 per kg seeds
}

PRECURSOR_NAMES = {
    'alcohol': 'Grain',
    'cannabis': 'Seed',
}

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
                'produces_to': None,    # produces money
                'consume_rate': 11,     # liters alcohol per hour per professional
                'produce_rate': None,   # price-dependent
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
                'produces_to': None,    # produces money
                'consume_rate': 9,      # kg cannabis per hour
                'produce_rate': None,   # price-dependent
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
    'alcohol': 100,     # $100 per liter
    'cannabis': 800,    # $800 per kg
}

PRICE_ABSORBER = {
    'alcohol': 80,      # High absorber → price barely moves with supply
    'cannabis': 50,     # Moderate
}

# Min/max price bounds (prevent prices from going unreasonably low or high)
PRICE_MIN = {
    'alcohol': 20,      # Floor: $20 per liter
    'cannabis': 150,    # Floor: $150 per kg
}

PRICE_MAX = {
    'alcohol': 200,     # Ceiling: $200 per liter
    'cannabis': 1500,   # Ceiling: $1500 per kg
}

POPULATION_LOOKBACK_HOURS = 24
SUPPLY_WINDOW_MINUTES = 30
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
