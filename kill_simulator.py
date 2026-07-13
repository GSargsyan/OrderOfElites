"""
=============================================================================
  ORDER OF ELITES -- Kill Mechanics Simulator
=============================================================================
  HOW TO USE:
  1. Change the values in SECTION 1 (attacker/defender stats)
  2. Change the values in SECTION 2 (formula constants) if you want
  3. Run:  python kill_simulator.py
  4. See the full breakdown + a randomized outcome at the bottom
  5. Run again to see a different random outcome with the same inputs
=============================================================================

  FORMULAS:
    Offense          = (AttackSkill + 1) x GunMult x CarAtkMult
    Defense          = (DefenseSkill + 1) x HouseMult x CarDefMult x CitadelMult
    RankFactor       = (AtkRank + 5) / (DefRank + 5)
    BudgetFactor     = 1 + 0.5 x (Budget / (Budget + 500,000))
    PowerRatio       = (Offense x RankFactor x BudgetFactor) / Defense
    HealthMod        = 1 + 0.3 x (1 - HP / 100)
    KillChance       = Floor + (Ceiling - Floor) x sigmoid(Steepness x (PowerRatio x DefHealthMod - 1 + Noise))
    BackfirePowerR   = (1 / PowerRatio) x BackfireModifier
    BackfireChance   = Floor + (Ceiling - Floor) x sigmoid(Steepness x (BackfirePowerR x AtkHealthMod - 1 + Noise))
    DmgToDefender    = 50 x (PowerRatio / (PowerRatio + 1)) x DmgMult x noise
    DmgToAttacker    = 50 x (1 / (PowerRatio + 1)) x DmgMult x noise

  HOW OUTCOMES ARE DECIDED:
    - "Clean" = the kill/backfire chance with zero randomness (pure math).
      "This run" = same formula but with a small random noise applied (+/-0.15).
      Each run rolls different noise, so "this run" varies slightly.
    - A random number 0-1 is rolled. If it's below KillChance, the target dies.
    - If target survives, both sides take health damage (formulas above).
    - Then another random number is rolled against BackfireChance. If below, attacker dies.
    - If attacker also survives, both walk away wounded.
    - Attacker takes health damage even on a successful kill.
=============================================================================
"""

import math
import random

# =============================================================================
# SECTION 1: SCENARIO — Change these to test different matchups
# =============================================================================

# --- Attack Type ---
# Options: "regular", "driveby", "sniping"
ATTACK_TYPE = "sniping"

# --- ATTACKER ---
ATTACKER_RANK = 12
ATTACKER_ATTACK_SKILL = 1700        # Raw attack skill points
ATTACKER_HEALTH = 100              # Current health (0-100)
ATTACKER_GUN_MULTIPLIER = 1.0     # Gun attack multiplier (1.0 = B-92, 4.0 = Intervention)
ATTACKER_CAR_ATTACK_MULT = 1.0    # Car attack multiplier (1.0 = no car / Apex, 3.0 = Bordeaux)
ATTACKER_OPERATIONAL_BUDGET = 100000  # $ dedicated to the operation

# --- DEFENDER ---
DEFENDER_RANK = 12
DEFENDER_DEFENSE_SKILL = 1200       # Raw defense skill points
DEFENDER_HEALTH = 100              # Current health (0-100)
DEFENDER_HOUSE_DEFENSE_MULT = 1.0  # House defense multiplier (1.0 = no house, 1.5 = Studio, 3.0 = Condo, 5.0 = Mansion)
DEFENDER_CAR_DEFENSE_MULT = 1.0    # Car defense multiplier (1.0 = no car / Apex, 3.0 = Vanguard/Imperium)
DEFENDER_IN_CITADEL = False        # Is the defender inside the Citadel?


# =============================================================================
# SECTION 2: FORMULA CONSTANTS — Tweak these to reshape the entire system
# =============================================================================

# --- Rank Factor ---
# RankFactor = (R_atk + RANK_OFFSET) / (R_def + RANK_OFFSET)
# Higher RANK_OFFSET = rank matters LESS. Lower = rank dominates.
RANK_OFFSET = 5

# --- Budget Factor ---
# BudgetFactor = 1 + BUDGET_MAX_BONUS * (Budget / (Budget + BUDGET_HALF_VALUE))
# BUDGET_HALF_VALUE: the $ amount at which you get half the max bonus
# BUDGET_MAX_BONUS: the maximum multiplier bonus from budget (e.g., 0.5 means range 1.0 to 1.5)
BUDGET_HALF_VALUE = 500_000
BUDGET_MAX_BONUS = 0.5

# --- Citadel ---
# Multiplier applied to defender's defense when inside the Citadel
CITADEL_MULTIPLIER = 10

# --- Noise (Randomness) ---
# Applied to PowerRatio before sigmoid. Controls how much drama/luck exists.
# ±0.05 = very deterministic, ±0.15 = moderate, ±0.30 = chaotic
NOISE_RANGE = 0.1

# --- Kill Chance Parameters (per attack type) ---
# Floor: minimum kill chance (never below this, even if massively outgunned)
# Ceiling: maximum kill chance (never above this, even if god-tier)
# Steepness: how sharply the curve transitions around PowerRatio=1
KILL_PARAMS = {
    "regular": {"floor": 0.02, "ceiling": 0.95, "steepness": 2.0},
    "driveby": {"floor": 0.015, "ceiling": 0.85, "steepness": 1.8},
    "sniping": {"floor": 0.01, "ceiling": 0.65, "steepness": 1.5},
}

# --- Backfire Parameters (per attack type) ---
# BackfireModifier: how exposed the attacker is (1.0 = fully, 0.25 = barely)
# Same floor/ceiling/steepness logic as kill chance
BACKFIRE_PARAMS = {
    "regular": {"floor": 0.03, "ceiling": 0.90, "steepness": 1.8, "modifier": 1.0},
    "driveby": {"floor": 0.02, "ceiling": 0.75, "steepness": 1.5, "modifier": 0.6},
    "sniping": {"floor": 0.005, "ceiling": 0.40, "steepness": 1.2, "modifier": 0.25},
}

# --- Health Vulnerability ---
# How much a wounded player is easier to kill.
# HealthMod = 1 + HEALTH_VULNERABILITY * (1 - HP/100)
# At 0.3: a player at 1% HP is 30% easier to kill. A player at 100% HP has no modifier.
# This is the whole point of sniping: chip their health, then finish them.
HEALTH_VULNERABILITY = 0.3

# --- Health Damage Constants ---
# BASE_DAMAGE_SCALE: scales the 0-50 base damage range
# Damage multipliers per attack type (for defender damage and attacker backfire damage)
BASE_DAMAGE_SCALE = 50
DAMAGE_MULT_DEFENDER = {"regular": 1.6, "driveby": 1.2, "sniping": 0.8}
DAMAGE_MULT_ATTACKER = {"regular": 1.4, "driveby": 1.0, "sniping": 0.5}
DAMAGE_NOISE = 0.15  # +/-15% random variance on damage


# =============================================================================
# SECTION 3: THE MATH — You don't need to touch this unless redesigning
# =============================================================================

def sigmoid(x):
    """Standard sigmoid function, clamped to avoid overflow."""
    x = max(-20, min(20, x))
    return 1.0 / (1.0 + math.exp(-x))


def compute_health_mod(hp):
    """Wounded targets/attackers are easier to kill. 100 HP = 1.0, 1 HP = 1+HEALTH_VULNERABILITY."""
    return 1 + HEALTH_VULNERABILITY * (1 - hp / 100.0)


def compute_kill_chance(power_ratio, attack_type, noise, defender_hp=100):
    """Compute kill chance using sigmoid curve with noise. Low defender HP boosts this."""
    health_mod = compute_health_mod(defender_hp)
    adjusted_ratio = power_ratio * health_mod
    p = KILL_PARAMS[attack_type]
    raw = sigmoid(p["steepness"] * (adjusted_ratio - 1 + noise))
    return p["floor"] + (p["ceiling"] - p["floor"]) * raw


def compute_backfire_chance(power_ratio, attack_type, noise, attacker_hp=100):
    """Compute backfire kill chance (attacker dies after failed attack). Low attacker HP boosts this."""
    p = BACKFIRE_PARAMS[attack_type]
    # Invert the power ratio and apply the backfire modifier
    backfire_ratio = (1.0 / max(power_ratio, 0.001)) * p["modifier"]
    # Wounded attacker is more vulnerable to backfire
    health_mod = compute_health_mod(attacker_hp)
    adjusted_ratio = backfire_ratio * health_mod
    raw = sigmoid(p["steepness"] * (adjusted_ratio - 1 + noise))
    return p["floor"] + (p["ceiling"] - p["floor"]) * raw


def compute_damage_to_defender(power_ratio, attack_type):
    """How much health % the defender loses (if they survive)."""
    base = BASE_DAMAGE_SCALE * (power_ratio / (power_ratio + 1))
    mult = DAMAGE_MULT_DEFENDER[attack_type]
    noise = random.uniform(1 - DAMAGE_NOISE, 1 + DAMAGE_NOISE)
    return max(1, min(99, base * mult * noise))


def compute_damage_to_attacker(power_ratio, attack_type):
    """How much health % the attacker loses (if attack fails and they survive backfire)."""
    base = BASE_DAMAGE_SCALE * (1.0 / (power_ratio + 1))
    mult = DAMAGE_MULT_ATTACKER[attack_type]
    noise = random.uniform(1 - DAMAGE_NOISE, 1 + DAMAGE_NOISE)
    return max(1, min(99, base * mult * noise))


def run_simulation():
    print("=" * 70)
    print("  ORDER OF ELITES — Kill Mechanics Simulation")
    print("=" * 70)

    # --- Step 1: Effective Power Scores ---
    offense = (ATTACKER_ATTACK_SKILL + 1) * ATTACKER_GUN_MULTIPLIER * ATTACKER_CAR_ATTACK_MULT
    citadel = CITADEL_MULTIPLIER if DEFENDER_IN_CITADEL else 1
    defense = (DEFENDER_DEFENSE_SKILL + 1) * DEFENDER_HOUSE_DEFENSE_MULT * DEFENDER_CAR_DEFENSE_MULT * citadel

    print(f"\n{'-' * 70}")
    print(f"  STEP 1: Effective Power Scores")
    print(f"{'-' * 70}")
    print(f"  Offense = ({ATTACKER_ATTACK_SKILL} + 1) x {ATTACKER_GUN_MULTIPLIER} gun x {ATTACKER_CAR_ATTACK_MULT} car")
    print(f"         = {offense:.1f}")
    print(f"  Defense = ({DEFENDER_DEFENSE_SKILL} + 1) x {DEFENDER_HOUSE_DEFENSE_MULT} house x {DEFENDER_CAR_DEFENSE_MULT} car x {citadel} citadel")
    print(f"         = {defense:.1f}")

    # --- Step 2: Modifiers ---
    rank_factor = (ATTACKER_RANK + RANK_OFFSET) / (DEFENDER_RANK + RANK_OFFSET)
    budget_factor = 1 + BUDGET_MAX_BONUS * (ATTACKER_OPERATIONAL_BUDGET / (ATTACKER_OPERATIONAL_BUDGET + BUDGET_HALF_VALUE))
    def_health_mod = compute_health_mod(DEFENDER_HEALTH)
    atk_health_mod = compute_health_mod(ATTACKER_HEALTH)

    print(f"\n{'-' * 70}")
    print(f"  STEP 2: Modifiers")
    print(f"{'-' * 70}")
    print(f"  RankFactor   = ({ATTACKER_RANK} + {RANK_OFFSET}) / ({DEFENDER_RANK} + {RANK_OFFSET}) = {rank_factor:.3f}")
    print(f"  BudgetFactor = 1 + {BUDGET_MAX_BONUS} x (${ATTACKER_OPERATIONAL_BUDGET:,} / (${ATTACKER_OPERATIONAL_BUDGET:,} + ${BUDGET_HALF_VALUE:,})) = {budget_factor:.3f}")
    print(f"  Def HealthMod = 1 + {HEALTH_VULNERABILITY} x (1 - {DEFENDER_HEALTH}/100) = {def_health_mod:.3f}  {'(wounded!)' if DEFENDER_HEALTH < 100 else '(full HP)'}")
    print(f"  Atk HealthMod = 1 + {HEALTH_VULNERABILITY} x (1 - {ATTACKER_HEALTH}/100) = {atk_health_mod:.3f}  {'(wounded!)' if ATTACKER_HEALTH < 100 else '(full HP)'}")

    # --- Step 3: Power Ratio ---
    power_ratio = (offense * rank_factor * budget_factor) / defense

    print(f"\n{'-' * 70}")
    print(f"  STEP 3: Power Ratio")
    print(f"{'-' * 70}")
    print(f"  PowerRatio = ({offense:.1f} x {rank_factor:.3f} x {budget_factor:.3f}) / {defense:.1f}")
    print(f"             = {power_ratio:.4f}")
    if power_ratio > 1:
        print(f"  >> Attacker has the edge")
    elif power_ratio < 1:
        print(f"  >> Defender has the edge")
    else:
        print(f"  >> Dead even")

    # --- Step 4: Kill Chance (no randomness) ---
    kill_chance_clean = compute_kill_chance(power_ratio, ATTACK_TYPE, noise=0, defender_hp=DEFENDER_HEALTH)

    print(f"\n{'-' * 70}")
    print(f"  STEP 4: Kill Chance -- {ATTACK_TYPE.upper()}")
    print(f"{'-' * 70}")
    p = KILL_PARAMS[ATTACK_TYPE]
    print(f"  Parameters: Floor={p['floor']*100:.1f}%, Ceiling={p['ceiling']*100:.1f}%, Steepness={p['steepness']}")
    print(f"  PowerRatio x DefHealthMod = {power_ratio:.4f} x {def_health_mod:.3f} = {power_ratio * def_health_mod:.4f}")
    print(f"  Kill Chance (no randomness) = {kill_chance_clean * 100:.2f}%")

    # --- Step 5: Apply Randomness ---
    noise = random.uniform(-NOISE_RANGE, NOISE_RANGE)
    kill_chance_final = compute_kill_chance(power_ratio, ATTACK_TYPE, noise, defender_hp=DEFENDER_HEALTH)

    print(f"\n{'-' * 70}")
    print(f"  STEP 5: Randomness Applied")
    print(f"{'-' * 70}")
    print(f"  Noise rolled: {noise:+.4f}  (range: +/-{NOISE_RANGE})")
    print(f"  Kill Chance (with noise) = {kill_chance_final * 100:.2f}%")

    # Show the range of possible outcomes with randomness
    kill_min = compute_kill_chance(power_ratio, ATTACK_TYPE, -NOISE_RANGE, defender_hp=DEFENDER_HEALTH)
    kill_max = compute_kill_chance(power_ratio, ATTACK_TYPE, +NOISE_RANGE, defender_hp=DEFENDER_HEALTH)
    print(f"  Possible range: {kill_min * 100:.2f}% -- {kill_max * 100:.2f}%")

    # --- Step 6: Simulate the attack ---
    roll = random.random()
    attack_succeeds = roll < kill_chance_final

    print(f"\n{'-' * 70}")
    print(f"  STEP 6: ** THE ATTACK **")
    print(f"{'-' * 70}")
    print(f"  Coin flip: {roll:.4f} vs {kill_chance_final:.4f}")
    if attack_succeeds:
        # Attacker still takes damage even on a successful kill
        dmg_to_atk = compute_damage_to_attacker(power_ratio, ATTACK_TYPE)
        atk_new_hp = max(0, ATTACKER_HEALTH - dmg_to_atk)
        print(f"\n  Attacker Health Damage:")
        print(f"    Attacker takes {dmg_to_atk:.1f}% damage -> HP: {ATTACKER_HEALTH:.0f}% -> {atk_new_hp:.1f}%")
        final_atk_hp = atk_new_hp
        final_def_hp = 0  # Target is dead
    else:
        print(f"  +========================================+")
        print(f"  |   [X] ATTACK FAILED -- Target lives    |")
        print(f"  +========================================+")

        # --- Health damage to both ---
        dmg_to_def = compute_damage_to_defender(power_ratio, ATTACK_TYPE)
        dmg_to_atk = compute_damage_to_attacker(power_ratio, ATTACK_TYPE)
        def_new_hp = max(0, DEFENDER_HEALTH - dmg_to_def)
        atk_new_hp_before_backfire = max(0, ATTACKER_HEALTH - dmg_to_atk)

        print(f"\n  Health Damage:")
        print(f"    Defender takes {dmg_to_def:.1f}% damage -> HP: {DEFENDER_HEALTH:.0f}% -> {def_new_hp:.1f}%")
        print(f"    Attacker takes {dmg_to_atk:.1f}% damage -> HP: {ATTACKER_HEALTH:.0f}% -> {atk_new_hp_before_backfire:.1f}%")

        # --- Step 7: Backfire ---
        # Use the attacker's HP AFTER taking damage from the failed attack
        atk_hp_for_backfire = atk_new_hp_before_backfire
        backfire_noise = random.uniform(-NOISE_RANGE, NOISE_RANGE)
        backfire_chance_clean = compute_backfire_chance(power_ratio, ATTACK_TYPE, noise=0, attacker_hp=atk_hp_for_backfire)
        backfire_chance_final = compute_backfire_chance(power_ratio, ATTACK_TYPE, backfire_noise, attacker_hp=atk_hp_for_backfire)

        bp = BACKFIRE_PARAMS[ATTACK_TYPE]
        backfire_ratio = (1.0 / max(power_ratio, 0.001)) * bp["modifier"]
        atk_health_mod_post = compute_health_mod(atk_hp_for_backfire)

        print(f"\n{'-' * 70}")
        print(f"  STEP 7: Backfire Check -- {ATTACK_TYPE.upper()}")
        print(f"{'-' * 70}")
        print(f"  BackfireModifier: {bp['modifier']} ({'fully exposed' if bp['modifier'] == 1.0 else 'partially protected' if bp['modifier'] > 0.3 else 'far away, hard to trace'})")
        print(f"  BackfirePowerRatio = (1 / {power_ratio:.4f}) x {bp['modifier']} = {backfire_ratio:.4f}")
        print(f"  Attacker HP for backfire: {atk_hp_for_backfire:.1f}% (after taking damage)")
        print(f"  Atk HealthMod (post-damage) = {atk_health_mod_post:.3f}  {'(wounded!)' if atk_hp_for_backfire < 100 else '(full HP)'}")
        print(f"  Adjusted BackfireRatio = {backfire_ratio:.4f} x {atk_health_mod_post:.3f} = {backfire_ratio * atk_health_mod_post:.4f}")
        print(f"  Parameters: Floor={bp['floor']*100:.1f}%, Ceiling={bp['ceiling']*100:.1f}%, Steepness={bp['steepness']}")
        print(f"  Backfire Chance (no randomness) = {backfire_chance_clean * 100:.2f}%")
        print(f"  Backfire Noise rolled: {backfire_noise:+.4f}")
        print(f"  Backfire Chance (with noise)    = {backfire_chance_final * 100:.2f}%")

        bf_min = compute_backfire_chance(power_ratio, ATTACK_TYPE, -NOISE_RANGE, attacker_hp=atk_hp_for_backfire)
        bf_max = compute_backfire_chance(power_ratio, ATTACK_TYPE, +NOISE_RANGE, attacker_hp=atk_hp_for_backfire)
        print(f"  Possible range: {bf_min * 100:.2f}% -- {bf_max * 100:.2f}%")

        backfire_roll = random.random()
        backfire_kills = backfire_roll < backfire_chance_final

        print(f"\n  Coin flip: {backfire_roll:.4f} vs {backfire_chance_final:.4f}")
        if backfire_kills:
            print(f"  +========================================+")
            print(f"  |   [X] BACKFIRE -- ATTACKER IS DEAD!    |")
            print(f"  +========================================+")
            print(f"  -> Attacker's account is terminated.")
            final_atk_hp = 0  # Attacker is dead
            final_def_hp = def_new_hp
        else:
            print(f"  +========================================+")
            print(f"  |   Both survive. Wounds exchanged.      |")
            print(f"  +========================================+")
            print(f"  -> Attacker HP: {atk_new_hp_before_backfire:.1f}%")
            print(f"  -> Defender HP: {def_new_hp:.1f}%")
            final_atk_hp = atk_new_hp_before_backfire
            final_def_hp = def_new_hp

    # --- Summary ---
    print(f"\n{'=' * 70}")
    print(f"  QUICK REFERENCE")
    print(f"{'=' * 70}")
    print(f"  Attack Type:     {ATTACK_TYPE.upper()}")
    print(f"  Attacker:        Rank {ATTACKER_RANK}, ATK {ATTACKER_ATTACK_SKILL}, HP {ATTACKER_HEALTH}%")
    print(f"                   Gun x{ATTACKER_GUN_MULTIPLIER}, Car ATK x{ATTACKER_CAR_ATTACK_MULT}")
    print(f"                   Budget: ${ATTACKER_OPERATIONAL_BUDGET:,}")
    print(f"  Defender:        Rank {DEFENDER_RANK}, DEF {DEFENDER_DEFENSE_SKILL}, HP {DEFENDER_HEALTH}%")
    print(f"                   House x{DEFENDER_HOUSE_DEFENSE_MULT}, Car DEF x{DEFENDER_CAR_DEFENSE_MULT}")
    print(f"                   In Citadel: {'YES' if DEFENDER_IN_CITADEL else 'No'}")
    print(f"  --------------------------------------")
    print(f"  Power Ratio:     {power_ratio:.4f}")
    print(f"  Kill Chance:     {kill_chance_clean * 100:.2f}%  (clean)  |  {kill_chance_final * 100:.2f}%  (this run)")
    if not attack_succeeds:
        print(f"  Backfire Chance: {backfire_chance_clean * 100:.2f}%  (clean)  |  {backfire_chance_final * 100:.2f}%  (this run)")
    print(f"  --------------------------------------")
    atk_status = "DEAD" if final_atk_hp == 0 else f"{final_atk_hp:.1f}%"
    def_status = "DEAD" if final_def_hp == 0 else f"{final_def_hp:.1f}%"
    print(f"  Attacker Health: {atk_status}")
    print(f"  Defender Health: {def_status}")
    print(f"{'=' * 70}\n")


if __name__ == "__main__":
    run_simulation()
