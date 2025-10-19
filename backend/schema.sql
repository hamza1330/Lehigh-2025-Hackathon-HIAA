
--- `schema.sql`

-- ===========================================
-- LockIN — PostgreSQL Schema (Time-boxed groups)
-- Includes: avatars, notifications, clone, progress view, integrity triggers
-- Excludes: join-with-code, push/email devices
-- ===========================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ---------- Enums ----------
DO $$ BEGIN
  CREATE TYPE group_status AS ENUM ('pending','active','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE member_role AS ENUM ('owner','admin','member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE participant_role AS ENUM ('host','participant');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('scheduled','running','paused','ended','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE goal_period AS ENUM ('daily','weekly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_kind AS ENUM (
    'group_invite',
    'milestone_member',
    'milestone_group',
    'session_reminder',
    'generic'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('pending','accepted','declined','read');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- Users ----------
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         CITEXT UNIQUE NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth_identities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider     TEXT NOT NULL,   -- 'cognito', 'google', etc.
  subject      TEXT NOT NULL,   -- provider 'sub'
  profile_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(provider, subject)
);

-- ---------- Groups (time-boxed + recurring targets) ----------
CREATE TABLE IF NOT EXISTS groups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  name          TEXT NOT NULL,
  description   TEXT,

  start_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_at        TIMESTAMPTZ NOT NULL,
  timezone      TEXT NOT NULL DEFAULT 'America/New_York',

  period        goal_period NOT NULL DEFAULT 'daily',
  period_target_minutes INTEGER NOT NULL DEFAULT 60 CHECK (period_target_minutes > 0),

  status        group_status NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS idx_groups_owner   ON groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_groups_status  ON groups(status);
CREATE INDEX IF NOT EXISTS idx_groups_end_at  ON groups(end_at);

-- ---------- Group Members ----------
CREATE TABLE IF NOT EXISTS group_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role         member_role NOT NULL DEFAULT 'member',
  override_period_target_minutes INTEGER NULL CHECK (
    override_period_target_minutes IS NULL OR override_period_target_minutes > 0
  ),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user  ON group_members(user_id);

-- prevent adding members to archived groups
CREATE OR REPLACE FUNCTION prevent_members_on_archived_groups()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT status FROM groups WHERE id = NEW.group_id) = 'archived' THEN
    RAISE EXCEPTION 'Cannot add members to an archived group';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_no_members_archived ON group_members;
CREATE TRIGGER trg_no_members_archived
  BEFORE INSERT ON group_members
  FOR EACH ROW EXECUTE FUNCTION prevent_members_on_archived_groups();

-- ---------- Sessions ----------
CREATE TABLE IF NOT EXISTS sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     UUID NULL REFERENCES groups(id) ON DELETE SET NULL,
  creator_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status       session_status NOT NULL DEFAULT 'scheduled',
  started_at   TIMESTAMPTZ,
  ended_at     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ended_at IS NULL OR started_at IS NOT NULL),
  CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE INDEX IF NOT EXISTS idx_sessions_group ON sessions(group_id);

CREATE TABLE IF NOT EXISTS session_participants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role         participant_role NOT NULL DEFAULT 'participant',
  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_sp_session ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_sp_user    ON session_participants(user_id);

-- ---------- Time Logs ----------
CREATE TABLE IF NOT EXISTS time_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES session_participants(id) ON DELETE CASCADE,
  started_at     TIMESTAMPTZ NOT NULL,
  ended_at       TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ended_at >= started_at)
);

-- logs must be within session window
CREATE OR REPLACE FUNCTION enforce_log_within_session()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE s sessions;
BEGIN
  SELECT * INTO s FROM sessions
   WHERE id = (SELECT session_id FROM session_participants WHERE id = NEW.participant_id);
  IF s.started_at IS NULL OR s.ended_at IS NULL THEN
    RAISE EXCEPTION 'Cannot log time until session has start and end times';
  END IF;
  IF NEW.started_at < s.started_at OR NEW.ended_at > s.ended_at THEN
    RAISE EXCEPTION 'Time log must be within session window [% - %]', s.started_at, s.ended_at;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_within_session ON time_logs;
CREATE TRIGGER trg_log_within_session
  BEFORE INSERT OR UPDATE ON time_logs
  FOR EACH ROW EXECUTE FUNCTION enforce_log_within_session();

-- ---------- Notifications ----------
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind         notification_kind NOT NULL,
  status       notification_status NOT NULL DEFAULT 'pending',
  title        TEXT,
  body         TEXT,
  group_id     UUID REFERENCES groups(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, created_at DESC);

-- ---------- Current-Period Progress View ----------
CREATE OR REPLACE VIEW group_member_period_progress AS
WITH params AS (
  SELECT
    g.id AS group_id,
    g.period,
    g.start_at,
    g.end_at,
    g.timezone,
    COALESCE(gm.override_period_target_minutes, g.period_target_minutes) AS target_minutes,
    gm.user_id
  FROM groups g
  JOIN group_members gm ON gm.group_id = g.id
  WHERE g.status IN ('pending','active')
),
window_base AS (
  SELECT
    p.*,
    CASE
      WHEN p.period = 'daily'
        THEN (date_trunc('day', (now() AT TIME ZONE p.timezone)) AT TIME ZONE p.timezone)
      WHEN p.period = 'weekly'
        THEN (date_trunc('week', (now() AT TIME ZONE p.timezone)) AT TIME ZONE p.timezone)
    END AS w_start
  FROM params p
),
clamped AS (
  SELECT
    w.*,
    GREATEST(w.w_start, w.start_at) AS period_start,
    LEAST(
      CASE WHEN w.period = 'daily'  THEN w.w_start + interval '1 day'
           WHEN w.period = 'weekly' THEN w.w_start + interval '1 week' END,
      w.end_at
    ) AS period_end
  FROM window_base w
),
accum AS (
  SELECT
    c.group_id, c.user_id, c.target_minutes, c.period_start, c.period_end,
    COALESCE(SUM(EXTRACT(EPOCH FROM (tl.ended_at - tl.started_at)))::bigint, 0) AS seconds_done
  FROM clamped c
  LEFT JOIN sessions s
         ON s.group_id = c.group_id
  LEFT JOIN session_participants sp
         ON sp.session_id = s.id AND sp.user_id = c.user_id
  LEFT JOIN time_logs tl
         ON tl.participant_id = sp.id
        AND tl.started_at < c.period_end
        AND tl.ended_at   > c.period_start
  GROUP BY 1,2,3,4,5
)
SELECT
  group_id,
  user_id,
  period_start,
  period_end,
  seconds_done,
  target_minutes,
  (seconds_done >= target_minutes * 60) AS goal_met
FROM accum;

-- ---------- Maintenance ----------
CREATE OR REPLACE FUNCTION archive_expired_groups()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE n INT;
BEGIN
  UPDATE groups
     SET status = 'archived',
         updated_at = now()
   WHERE status <> 'archived'
     AND end_at <= now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- ---------- Clone Group (Repeat) ----------
CREATE OR REPLACE FUNCTION clone_group(original_group UUID, new_owner UUID)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE new_group UUID;
BEGIN
  INSERT INTO groups (owner_id, name, description, period, period_target_minutes, timezone,
                      start_at, end_at, status)
  SELECT new_owner,
         name,
         description,
         period,
         period_target_minutes,
         timezone,
         now(),
         now() + (end_at - start_at),
         'active'
    FROM groups WHERE id = original_group
  RETURNING id INTO new_group;

  INSERT INTO group_members (group_id, user_id, role, override_period_target_minutes)
  SELECT new_group, gm.user_id, gm.role, gm.override_period_target_minutes
    FROM group_members gm
   WHERE gm.group_id = original_group;

  RETURN new_group;
END $$;