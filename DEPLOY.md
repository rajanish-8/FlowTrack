# FlowTrack — Deployment Guide

This guide covers deploying FlowTrack to **Vercel** (frontend) and **Railway** (backend).

---

## 1. 🌐 Frontend — Vercel

### Prerequisites
- [Vercel account](https://vercel.com) (free tier works)
- Vercel CLI: `npm i -g vercel`

### `vercel.json` (place in `frontend/`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Deploy Steps

```bash
# From the frontend directory
cd frontend

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel --prod
```

### Environment Variables (set in Vercel Dashboard → Project → Settings → Environment Variables)

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://your-backend.railway.app` |
| `VITE_APP_NAME` | `FlowTrack` |

> You can also set these via CLI: `vercel env add VITE_API_BASE_URL production`

---

## 2. 🚂 Backend — Railway

### Prerequisites
- [Railway account](https://railway.app) (free tier works)
- Railway CLI: `npm i -g @railway/cli`

### `Procfile` (place in `Backend/flowtrack/`)

```
web: gunicorn flowtrack.wsgi --bind 0.0.0.0:$PORT
```

### `railway.toml` (place in `Backend/flowtrack/`)

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "gunicorn flowtrack.wsgi --bind 0.0.0.0:$PORT"
healthcheckPath = "/api/"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### Add `gunicorn` to requirements

```bash
cd Backend/flowtrack
echo "gunicorn" >> requirements.txt
```

### Deploy Steps

```bash
# Login to Railway
railway login

# Create a new project
railway init

# Deploy
railway up
```

### Environment Variables (set in Railway Dashboard → Service → Variables)

| Variable | Value |
|---|---|
| `SECRET_KEY` | A long random string (use `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`) |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `your-app.railway.app` |
| `DATABASE_URL` | Auto-set by Railway PostgreSQL plugin |
| `CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app` |
| `EMAIL_BACKEND` | `django.core.mail.backends.console.EmailBackend` |

### Attach a PostgreSQL Database

1. Railway Dashboard → your project → **+ New** → **Database** → **PostgreSQL**  
2. Railway automatically sets `DATABASE_URL` for the linked service.  
3. Update `settings.py` to use `dj-database-url`:

```python
import dj_database_url
import os

DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL', 'sqlite:///db.sqlite3'),
        conn_max_age=600,
    )
}
```

Add to requirements: `dj-database-url psycopg2-binary`

### Run Migrations on Railway

```bash
railway run python manage.py migrate
railway run python manage.py createsuperuser
```

---

## 3. 🔁 Full Stack Production Checklist

- [ ] `DEBUG=False` on backend
- [ ] `SECRET_KEY` is a strong random value (not the default)
- [ ] `ALLOWED_HOSTS` includes your Railway domain
- [ ] `CORS_ALLOWED_ORIGINS` includes your Vercel domain
- [ ] Static files served via `whitenoise` (add to `requirements.txt` and `MIDDLEWARE`)
- [ ] PostgreSQL database attached on Railway
- [ ] `VITE_API_BASE_URL` points to your Railway URL in Vercel env vars
- [ ] `gunicorn` in `requirements.txt`

---

## 4. 🔒 Static Files with WhiteNoise (recommended)

```bash
pip install whitenoise
echo "whitenoise" >> requirements.txt
```

In `settings.py`:

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # <-- add this
    ...
]

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

Then run: `python manage.py collectstatic`

---

*Happy deploying! 🚀*
