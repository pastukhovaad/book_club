# book_club

## Deployment (Dokploy/DSM reverse proxy)

This repo is ready for Docker Compose deployment with DSM reverse proxy.

### Ports
- Frontend container `80` -> host `53341`
- Backend container `8000` -> host `53342`

### Environment
Create `.env` in the project root (see `.env.example`).

Key variables:
- `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`
- `DB_*` (PostgreSQL)
- `AWS_S3_*` (MinIO/S3 storage)
- `VITE_BASE_URL`, `VITE_API_BASE_URL` (frontend build)

### Run
```bash
docker compose up -d --build
```

### Notes
- Backend runs via Gunicorn and performs `migrate` + `collectstatic` on startup.
- Static files are served via WhiteNoise.
- Media files are stored in MinIO/S3.
