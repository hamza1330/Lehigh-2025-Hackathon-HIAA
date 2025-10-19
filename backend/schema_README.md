# 🧩 LockIN Database + API (FastAPI + PostgreSQL)

This repo contains the **database schema** and the **API contract** for LockIN.

- **Frontend:** Expo / React Native
- **Backend:** FastAPI (async SQLAlchemy)
- **Auth:** AWS Cognito (JWT → `(provider, sub)` → `profiles.id`)
- **DB:** PostgreSQL (RDS). Business logic is kept close to the DB via views, triggers, and SQL functions.

> Scope included: **time-boxed groups** (daily/weekly targets), **sessions & time logs**, **inbox/notifications**, **avatars (S3 presign)**, **repeat/clone group**.  
> Not included (by design right now): **join with code**, **push/email notifications**.

---

## Data Model (summary)

**Users & Auth**
- `profiles(id, email, display_name, avatar_url, created_at, updated_at)`
- `auth_identities(id, provider, subject, profile_id)` — maps Cognito `(provider, sub)` to a user

**Groups & Membership**
- `groups(id, owner_id, name, description, start_at, end_at, timezone, period(daily|weekly), period_target_minutes, status, created_at, updated_at)`
- `group_members(id, group_id, user_id, role(owner|admin|member), override_period_target_minutes, created_at)`

**Sessions & Focus**
- `sessions(id, group_id?, creator_id, status, started_at, ended_at, created_at)`
- `session_participants(id, session_id, user_id, role(host|participant))`
- `time_logs(id, participant_id, started_at, ended_at, created_at)`

**Inbox / Notifications**
- `notifications(id, recipient_id, kind(group_invite|milestone_member|milestone_group|session_reminder|generic), status, title, body, group_id?, created_at, read_at)`

**View**
- `group_member_period_progress` → live **current day/week** progress per member, clamped by `start_at..end_at` and computed in the group’s timezone.

**Functions / Triggers**
- `prevent_members_on_archived_groups()` (trigger)
- `enforce_log_within_session()` (trigger)
- `archive_expired_groups()`
- `clone_group(original_group, new_owner)`

---

## How Auth Connects (Cognito → DB)

1) Verify Cognito JWT (JWKS).  
2) Extract `(provider, sub)`.  
3) Upsert into `auth_identities`, create `profiles` on first login.  
4) Use `profiles.id` as the authenticated user id.

---

## FastAPI Endpoints (to implement)

### Auth & Profile
- `GET /api/me` → current profile & memberships
- `PATCH /api/me` → `{ display_name?, avatar_url? }`
- `POST /api/profiles/avatar/upload-url` → returns S3 presign payload; client uploads, then PATCH `/api/me` with `avatar_url`

### Groups
- `POST /api/groups` → create group (body: `name, description, start_at, end_at, period: "daily"|"weekly", period_target_minutes, timezone`)
- `GET /api/groups?status=active|archived`
- `GET /api/groups/{id}`
- `POST /api/groups/{id}:clone` → calls `SELECT clone_group(:id, :current_user)`
- Members
  - `GET /api/groups/{id}/members`
  - `POST /api/groups/{id}/members` `{ user_id }` (owner/admin)
  - `PATCH /api/groups/{id}/members/{userId}` `{ override_period_target_minutes | null }`
  - `DELETE /api/groups/{id}/members/{userId}`

### Sessions & Logs
- `POST /api/sessions` `{ group_id? }`
- `POST /api/sessions/{id}:start|pause|resume|stop`
- `POST /api/sessions/{id}/logs` `{ started_at, ended_at }`
- `GET /api/sessions/{id}`
- `GET /api/sessions/{id}/participants`

### Progress (Race View)
- `GET /api/groups/{id}/progress/current` → rows from `group_member_period_progress`  
  (fields: `user_id, seconds_done, target_minutes, goal_met, period_start, period_end`)

### Notifications (Inbox)
- `GET /api/notifications?unread=true&cursor_created_at=...&cursor_id=...&limit=20`
- `POST /api/notifications/{id}:read`
- Invites as notifications:
  - `POST /api/groups/{id}:invite` `{ recipient_id }` → create `kind='group_invite'`
  - `POST /api/invites/{id}:accept` → add to `group_members`, set `status='accepted'`
  - `POST /api/invites/{id}:decline`

### Maintenance
- `POST /api/maintenance/archive-expired-groups` → `SELECT archive_expired_groups();`

---

## Period Logic (used by the View)

- **daily:** midnight→midnight in `groups.timezone`
- **weekly:** `date_trunc('week', now() AT TIME ZONE tz)` in that timezone  
- Clamp to `[max(period_start, start_at), min(period_end, end_at))`  
- `goal_met = seconds_done >= target_minutes*60`

---

## Local & RDS

- Requires Postgres extensions: `pgcrypto`, `citext`
- Apply `schema.sql` (below) to your DB (local or RDS).
- Keep RDS in UTC; **do not** change server TZ. We store a per-group timezone string.

---

## Quick SQL Checks

```sql
-- live period view
SELECT * FROM group_member_period_progress WHERE group_id = '<uuid>' ORDER BY seconds_done DESC;

-- clone sanity
SELECT clone_group('<old_group_uuid>', '<owner_uuid>');
