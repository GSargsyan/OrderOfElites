# Fable Review — Full Project Analysis (2026-07-18)

Whole-project review: backend (all Django apps, Celery tasks, settings), Node bridge,
docker setup, kill simulator, and key frontend modules. Small obvious fixes were applied
directly (section 1). Bigger items are listed as a backlog (sections 2–4) — for each one,
decide whether to do it now or later.

Note: hardcoded dev credentials (`ooe_pwd`, Django SECRET_KEY, pgadmin creds) were
deliberately ignored per project owner — dev-phase convenience.

---

## 1. Fixes already applied (in this review session)

1. **Price formula population was always 1** — `update_prices` filtered on `last_login`,
   a Django `AbstractBaseUser` field the login view never sets (it sets `last_login_time`).
   So P in `B * (P*A)/((P*A)+S) * R` was permanently 1 and supply crushed prices far too
   easily. Fixed in `backend/ooe/black_market/tasks.py` (now filters `last_login_time`).
2. **`/black-market` socket had no auth** — `node/server.js` joined whatever `user_id`
   the client put in the query string, so anyone could subscribe to another player's full
   production/stash/market state (violates the secrecy principle). Now verifies the token
   against Django via `authConnection()` (same as the notifications namespace) and uses
   the backend-returned user id. Frontend doesn't connect to this namespace yet, so
   nothing breaks.
3. **Money-printing race in `sell_stash`** — two concurrent sells both read the same
   stash, both got paid, then both zeroed it. `sell_stash` and `buy_precursor` now
   row-lock the drug state (`_get_or_create_state(..., lock=True)` →
   `select_for_update`; the views are already `@transaction.atomic`) in
   `backend/ooe/black_market/controllers.py`.
4. **500s on bad URL params** — `start_skill_practice/<garbage>` and
   `start_mission/<garbage>` (or `start_mission/extraction`) crashed with KeyError.
   Both now return a clean 400 (`Invalid skill` / `Invalid mission`). Added a
   `SIMPLE_MISSIONS` tuple in `missions/constants.py`.
5. **Duplicate + misleading password validation** in `signup_user` — the same regex was
   checked twice with two different error messages, one claiming underscores are allowed
   (they aren't). Now one check with an accurate message.
6. **Float refunds into integer money column** — house/airplane sells added
   `price * 0.9` (float) to `money_cash`; cars already did `int(...)`. All three
   consistent now (`backend/ooe/items/controllers.py`).
7. **Repo hygiene** — `backend/celerybeat-schedule` (Celery runtime state) was
   git-tracked and perpetually dirty; untracked it (staged with `git rm --cached`, not
   committed) and expanded `.gitignore` (`__pycache__`, `backend/var/`, `psql/pgdata/`,
   `redis/data/`, `node_modules/`, `frontend/build/`).

All edited files pass syntax checks (`py_compile` / `node --check`). Backend/Node
containers bind-mount source, so restarting `backend`, `celery_worker`, `celery_beat`,
and `node` picks these up.

---

## 2. Bugs / broken features (bigger than a quick fix)

**B1. The Guns tab is half-built and 500s.**
`items/urls.py` and `views.py` route `get_user_guns` / `buy_gun` / `sell_gun`, and the
frontend `guns.js` tab calls them — but `ItemsController` has none of those methods and
there's no `GUNS` dict in `items/constants.py` (only `GUN_SELL_PERCENT` and the unused
`UserGun` model). Clicking the Guns tab errors. Fix = define gun data (kill_simulator
hints at B-92 1.0x → Intervention 4.0x attack multipliers) and mirror the car controller
methods.

**B2. Check-then-spend races everywhere money is deducted.**
The pattern `if user.money_cash < price: raise` followed by `F('money_cash') - price`
lets concurrent requests double-spend and drive cash negative — items buys, skill
practice, travel tickets, precursor buys. Clean fix: one shared helper, e.g.
`User.objects.filter(id=..., money_cash__gte=price).update(money_cash=F('money_cash') - price)`
and raise "Not enough money" when it returns 0 rows. Medium, touches ~5 files.
**Strongly recommended before any real players.**

**B3. `ItemsController` mutates via `user.save()` with no `update_fields`.**
That writes *every* column, so a flight completing mid-request (Celery sets `city`) can
be silently clobbered, and it leaves `user.money_cash` holding an `F()` expression
object afterwards. Should use queryset updates like the other apps. Folds naturally
into B2.

**B4. Mission/cooldown double-click race.**
`Mission.start` pays the reward before setting the cooldown, and `start_mission`'s
`@transaction.atomic` is commented out — two fast clicks can double-collect. Same family
as B2 (an atomic cache `add()` or a conditional check would do).

**B5. City-chat rate limiting only exists in Node.**
Anyone with a token can spam `POST /api/chat/send_city_message` directly, bypassing the
3s limit. The limit belongs in the Django view (cache-based, like the cooldowns).

**B6. Node only creates chat namespaces at startup.**
`initChatRooms` reads rooms once; adding a city later requires restarting Node. Fine for
now; worth a dynamic namespace (`io.of(/^\/chat-\d+$/)`) eventually.

**B7. "Online now" homepage stats are wrong-ish.**
They use `updated_at`, but most gameplay writes go through queryset `.update()` which
doesn't touch `updated_at`. A throttled "touch `last_seen`" in `auth_by_token`
(e.g., via cache, once per minute) would make this real.

**B8. `User.city` (and most city FKs) are `on_delete=CASCADE`.**
Deleting a city would delete players, houses, flight logs… `PROTECT` is safer. One
migration.

**B9. Reminder:** `TRAINING_TIME_MINUTES = 0.1  # testing` in
`black_market/constants.py` — restore to 60 before release.

---

## 3. Game design issues (opinions, no code touched)

**D1. Recon Op breaks the early economy.**
At rank 2 it pays $10k–20k per 20 min, ~15x Stakeout's $0–1.1k per 6 min, and it makes
pro skill training ($2k–10k) trivially affordable the moment it unlocks. The jump
between the two missions is a cliff, not a curve.

**D2. Extraction is a money faucet with a broken incentive for the driver.**
Initiator mints a flat $100k every 2h; the driver *loses a car* and gets only 150 exp.
Rational drivers will only ever burn the cheapest car ($20k Apex), so the net effect is
~+$80k printed per run per pair, and nobody drives for a stranger. The driver needs a
cut of the reward (or the initiator should fund the car), and the reward should probably
scale with the car consumed.

**D3. Supply weighting is inverted-feeling.**
In `update_prices`, a sale's weight *grows* from 0 to 100% over its first hour — so
dumping a huge stash has zero immediate price impact, then depresses the market for the
next 23 hours. If that delay is intentional (hiding market moves, matching the secrecy
philosophy), fine — but it also means a seller can fully dump at top price before their
own supply hits the market, every time. A weight that starts high and decays would
punish dumping instead.

**D4. Airplane pricing vs. income.**
$7.5M–200M planes against a best legitimate income of ~$60k/hour (recon spam) means the
first plane is ~5 days of nonstop 20-minute clicks and the Sentinelle is absurd.
Presumably drug production at higher ranks closes the gap — worth running the numbers
once meth/coke are tuned.

**D5. Professionals cap is unreachable.**
`PROFESSIONALS_MAX = 160` but base 10 + 5/rank at max rank 30 gives 155.

**D6. Username/email rules.**
Usernames disallow digits (`^[A-Za-z_]+$`) and require 6+ chars — intentional? Also
`email` is never collected at signup, so there's no account recovery path at all (fine
for draft, needed before launch).

---

## 4. Architecture notes (later, no urgency)

- `auth_by_token` reimplements DRF's `TokenAuthentication` with a nonstandard
  `Bearer: <token>` header, and tokens never expire or rotate. At some point switch to
  DRF's standard `Authorization: Token <key>` (or JWT) and delete the decorator.
- Frontend reads the token into `AUTH_TOKEN` once at module load
  (`modules/Base/index.js`), so login/logout only works because of full-page
  navigations — fragile; read from `localStorage` per request instead.
- Small frontend papercuts: `alert(error.response.data.message)` crashes on network
  errors (no `response`), and `formatSeconds` renders 2-hour cooldowns as `120:00`.

---

**Suggested priority:** B2 + B3 (money-race cluster), then B1 (guns), then the economy
decisions D1/D2.
