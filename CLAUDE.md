# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Order of Elites is an online text-based PBBG (Persistent Browser-Based Game) — a John Wick-inspired assassins' universe. Players earn money via missions and drug/alcohol production, kill each other (permadeath), chat, and send DMs. The draft game design/rules live in `README.md` (ranks, missions, black market economy formulas, weapons/cars/houses pricing, travel times, etc.). It might not match with what I actually have coded, because
I sometimes forget to update the README.md, so don't rely on that unless I tell you that
specific part is finilized.

## Architecture

Four services, orchestrated via `docker-compose.yml`, communicating over Redis pub/sub:

- **`backend/`** — Django REST API (port 8000). Source of truth for all game state (users, missions, items, black market economy). Django apps live under `backend/ooe/`: `base` (shared utils/constants/exceptions), `users`, `chat`, `cities`, `dashboard`, `missions`, `items`, `black_market`.
- **`node/`** — Express + Socket.IO real-time bridge (port 4000). Does **not** own game logic — it reads chat data via Sequelize (`node/modules/models.js`, mapped straight onto the Django-managed Postgres tables like `ooe_chat_rooms`/`ooe_messages`) and relays real-time events. It has no independent schema/migrations of its own.
- **`frontend/`** — React SPA (port 3000), organized as feature modules under `frontend/src/modules/` (`Dashboard`, `Chat`, `BlackMarket`, `Missions`, `Items`, `Skills`, `Networking`, `Home`, `Base`).
- **`psql`** / **`redis`** — Postgres and Redis containers. Redis is used both as the Celery broker and as the pub/sub transport between Django and Node.

### Django ↔ Node ↔ Frontend real-time flow

Django views never push over WebSockets directly. Instead:
1. A Django view/controller mutates state and calls `redis_client.publish(channel, json_payload)`.
2. Channels used: `city_message:<room_id>`, `dm_message:<user_id>`, `user_market_update:<user_id>`, `prices_updated`.
3. `node/server.js` subscribes to these channels (`redisSub.pSubscribe`/`subscribe`) and re-emits over the matching Socket.IO namespace (`/chat-<room_id>`, the DM notifications namespace, `/black-market`) to connected frontend clients.

### Game logic pattern (controllers)

Business logic is kept out of `views.py` and placed in `controllers.py` per app (e.g. `ooe/black_market/controllers.py: BlackMarketController`, `ooe/users/controllers.py: SkillsController`). Views stay thin: auth, request parsing, calling the controller, translating `OOEException` into a 400 response. Follow this split for new gameplay features rather than putting logic directly in views.

## Common commands

Local dev is Docker-based; there's no documented bare-metal setup.

```bash
./setup.sh                          # build, start, migrate, seed initial data (docker compose build/up/migrate/insert_initial_data)
docker compose up -d                # start all services
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py insert_initial_data   # seed cities/base data
docker compose exec backend python manage.py view_black_market     # inspect black market state (backend/ooe/black_market/management/commands)
./view_black_market.sh              # shortcut for the above
docker compose exec backend python manage.py makemigrations
```

Frontend (`frontend/`, also runnable outside Docker via `npm start`/`npm test`/`npm run build`) and Node (`node/`, `npm start`) each have their own `package.json`; the compose file bind-mounts source so `docker compose up` gives live reload for backend, frontend, and node.

There is no repo-wide lint/format command configured — match existing style in the file you're editing.


## Verification

Veritification and testing of new functionalities is done manually. I'll open the browser
check it myself.