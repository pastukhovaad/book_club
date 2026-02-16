#!/usr/bin/env sh
set -e

if [ -n "${DB_HOST:-}" ]; then
  echo "Waiting for database..."
  python - <<'PY'
import os
import time
import psycopg

host = os.environ.get("DB_HOST")
port = int(os.environ.get("DB_PORT", "5432"))
name = os.environ.get("DB_NAME")
user = os.environ.get("DB_USER")
password = os.environ.get("DB_PASSWORD")

def can_connect():
    try:
        conn = psycopg.connect(host=host, port=port, dbname=name, user=user, password=password, connect_timeout=5)
        conn.close()
        return True
    except Exception:
        return False

for attempt in range(30):
    if can_connect():
        print("Database is available")
        break
    print(f"Database unavailable, retrying... ({attempt + 1}/30)")
    time.sleep(2)
else:
    raise SystemExit("Database not available after 30 attempts")
PY
fi

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec gunicorn book_api.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers "${GUNICORN_WORKERS:-3}" \
  --threads "${GUNICORN_THREADS:-2}" \
  --timeout "${GUNICORN_TIMEOUT:-120}"
