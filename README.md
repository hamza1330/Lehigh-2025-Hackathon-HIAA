# LockIN Hackathon Demo

This workspace contains the LockIN FastAPI backend and Expo Router mobile client used for the 2025 Lehigh Hackathon demo.

## Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- PostgreSQL (with `pgcrypto` and `citext` extensions enabled)

## Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate  # Windows
pip install -r requirements.txt
copy .env.example .env    # adjust values for your database & Cognito/demo settings
```

Provision the database locally or in RDS and apply the schema:

```bash
psql "$LOCKIN_DATABASE_URL" -f ../schema.sql
```

Run the API:

```bash
uvicorn app.main:app --reload
```

> Authentication is now powered by Cognito. Set `LOCKIN_ALLOW_ANONYMOUS=false` once you have confirmed the pool configuration so only signed-in users can hit the API.

## Expo frontend

```bash
cd frontend
npm install
```

Expose the backend URL and Cognito settings to Expo (macOS/Linux shell shown, adapt for Windows PowerShell by using `$env:VAR = ...`):

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000 \
EXPO_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_rdjbvYb0Z \
EXPO_PUBLIC_COGNITO_APP_CLIENT_ID=1r86esmlk39hor1rfo04phol8l \
EXPO_PUBLIC_COGNITO_REGION=us-east-1 \
npx expo start
```

### Signing in

- Use the **Log in** screen with your email + password. The Expo app derives the Cognito username automatically, fetches an ID token, and then loads `/api/me`.
- Create new users from the **Create account** screen. After sign-up, enter the emailed code on the new **Confirm Account** screen, then log in.
- The **Settings → Sign Out** action clears the stored token and returns you to the login screen.

The app now calls the FastAPI endpoints for groups, sessions, notifications, maintenance, and profile updates with the Cognito bearer token attached.

## Maintenance action

Open **Settings → Archive Expired Groups** in the app to execute `POST /api/maintenance/archive-expired-groups`. The UI shows how many circles were archived.

## What works in the demo

- Cognito-backed authentication with login, sign-up, and sign-out flows.
- Group list pulls from `/api/groups` and live progress from `/api/groups/{id}/progress/current`.
- Group detail supports clocking in/out, creating sessions, and logging focus blocks through the API.
- Notifications inbox consumes `/api/notifications`, with invite accept/decline wired to the backend.
- Create Group form posts to `/api/groups` and navigates to the new circle on success.
- Maintenance button hits the backend housekeeping endpoint.

If you adjust the backend host/port, update the `EXPO_PUBLIC_API_BASE_URL` value and restart Expo.
