#!/bin/bash
docker compose exec backend python manage.py view_black_market "$@"
