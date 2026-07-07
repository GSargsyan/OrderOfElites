#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

docker compose build # --no-cache

docker compose up -d

docker compose exec backend python manage.py migrate

docker compose exec backend python manage.py insert_initial_data

