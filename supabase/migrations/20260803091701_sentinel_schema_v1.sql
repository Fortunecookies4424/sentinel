/*
# Sentinel - Core Schema (v1)

This migration creates the complete backend for Sentinel, a personal safety and
emergency response app. All data is user-owned and isolated per authenticated
account via Row Level Security.

## Tables created

1. `profiles` — extends auth.users with display info (name, photo, address, phone, preferences, emergency message, language, theme).
2. `contacts` — trusted emergency contacts (name, phone, email, relationship, is_primary, avatar).
3. `emergency_sessions` — an SOS event: status (active/resolved/cancelled), start/end time, message, device info, battery, notified contact count, last location snapshot.
4. `location_updates` — time-series points captured during an active emergency session or live-share window (lat, lng, accuracy, battery, session id).
5. `check_ins` — scheduled safety check-ins with note, duration minutes, status (active/completed/missed/expired), due-at timestamp.
6. `medical_profiles` — optional medical info per user (blood group, allergies, conditions, medications, height, weight, dob, notes).
7. `activity_log` — timeline of user actions (sos_activated, sos_cancelled, location_shared, check_in_scheduled, check_in_completed, check_in_missed, contact_added).
8. `notification_logs` — push notification records (type, title, body, status, created_at).

## Security

- RLS enabled on every table.
- All policies scope to `TO authenticated` with `auth.uid() = user_id` ownership checks.
- Owner columns default to `auth.uid()` so inserts that omit user_id succeed.
- `profiles` is keyed on `auth.users(id)` directly (id = user's auth id).

## Notes

1. No admin tables — the app is fully user-centric.
2. `emergency_sessions.last_lat/last_lng` gives a fast single-point snapshot without joining location_updates.
3. Designed for future expansion (family groups, wearables) — relationships stay user-scoped.
*/

-- 1. profiles (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  address text,
  avatar_url text,
  emergency_message text NOT NULL DEFAULT 'I need immediate assistance. This emergency alert was automatically sent from Sentinel. My live location is attached.',
  language text NOT NULL DEFAULT 'en',
  theme text NOT NULL DEFAULT 'system',
  biometric_enabled boolean NOT NULL DEFAULT false,
  share_location_enabled boolean NOT NULL DEFAULT true,
  notifications_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. contacts
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  relationship text NOT NULL DEFAULT 'friend',
  is_primary boolean NOT NULL DEFAULT false,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. emergency_sessions
CREATE TABLE IF NOT EXISTS emergency_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  message text NOT NULL DEFAULT 'I need immediate assistance. This emergency alert was automatically sent from Sentinel. My live location is attached.',
  contacts_notified integer NOT NULL DEFAULT 0,
  device_model text,
  battery_level integer,
  last_lat double precision,
  last_lng double precision,
  last_accuracy double precision,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

-- 4. location_updates
CREATE TABLE IF NOT EXISTS location_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES emergency_sessions(id) ON DELETE CASCADE,
  share_token text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  accuracy double precision,
  battery_level integer,
  speed double precision,
  heading double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. check_ins
CREATE TABLE IF NOT EXISTS check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  note text NOT NULL DEFAULT 'I''m travelling home.',
  duration_minutes integer NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'active',
  due_at timestamptz NOT NULL,
  triggered_sos boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- 6. medical_profiles
CREATE TABLE IF NOT EXISTS medical_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  blood_group text,
  allergies text,
  medical_conditions text,
  emergency_notes text,
  emergency_medication text,
  height text,
  weight text,
  date_of_birth date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. activity_log
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  description text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. notification_logs
CREATE TABLE IF NOT EXISTS notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  status text NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_sessions_user_id ON emergency_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_sessions_status ON emergency_sessions(status);
CREATE INDEX IF NOT EXISTS idx_location_updates_session_id ON location_updates(session_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_user_id ON location_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_status ON check_ins(status);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON contacts;
CREATE TRIGGER trg_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_medical_profiles_updated_at ON medical_profiles;
CREATE TRIGGER trg_medical_profiles_updated_at BEFORE UPDATE ON medical_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============ RLS ============

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- profiles (id = auth uid)
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- contacts
DROP POLICY IF EXISTS "select_own_contacts" ON contacts;
CREATE POLICY "select_own_contacts" ON contacts FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_contacts" ON contacts;
CREATE POLICY "insert_own_contacts" ON contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_contacts" ON contacts;
CREATE POLICY "update_own_contacts" ON contacts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_contacts" ON contacts;
CREATE POLICY "delete_own_contacts" ON contacts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- emergency_sessions
DROP POLICY IF EXISTS "select_own_sessions" ON emergency_sessions;
CREATE POLICY "select_own_sessions" ON emergency_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_sessions" ON emergency_sessions;
CREATE POLICY "insert_own_sessions" ON emergency_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_sessions" ON emergency_sessions;
CREATE POLICY "update_own_sessions" ON emergency_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_sessions" ON emergency_sessions;
CREATE POLICY "delete_own_sessions" ON emergency_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- location_updates
DROP POLICY IF EXISTS "select_own_locations" ON location_updates;
CREATE POLICY "select_own_locations" ON location_updates FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_locations" ON location_updates;
CREATE POLICY "insert_own_locations" ON location_updates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_locations" ON location_updates;
CREATE POLICY "update_own_locations" ON location_updates FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_locations" ON location_updates;
CREATE POLICY "delete_own_locations" ON location_updates FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- check_ins
DROP POLICY IF EXISTS "select_own_check_ins" ON check_ins;
CREATE POLICY "select_own_check_ins" ON check_ins FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_check_ins" ON check_ins;
CREATE POLICY "insert_own_check_ins" ON check_ins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_check_ins" ON check_ins;
CREATE POLICY "update_own_check_ins" ON check_ins FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_check_ins" ON check_ins;
CREATE POLICY "delete_own_check_ins" ON check_ins FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- medical_profiles
DROP POLICY IF EXISTS "select_own_medical" ON medical_profiles;
CREATE POLICY "select_own_medical" ON medical_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_medical" ON medical_profiles;
CREATE POLICY "insert_own_medical" ON medical_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_medical" ON medical_profiles;
CREATE POLICY "update_own_medical" ON medical_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_medical" ON medical_profiles;
CREATE POLICY "delete_own_medical" ON medical_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- activity_log
DROP POLICY IF EXISTS "select_own_activity" ON activity_log;
CREATE POLICY "select_own_activity" ON activity_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_activity" ON activity_log;
CREATE POLICY "insert_own_activity" ON activity_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_activity" ON activity_log;
CREATE POLICY "update_own_activity" ON activity_log FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_activity" ON activity_log;
CREATE POLICY "delete_own_activity" ON activity_log FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- notification_logs
DROP POLICY IF EXISTS "select_own_notifications" ON notification_logs;
CREATE POLICY "select_own_notifications" ON notification_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_notifications" ON notification_logs;
CREATE POLICY "insert_own_notifications" ON notification_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_notifications" ON notification_logs;
CREATE POLICY "update_own_notifications" ON notification_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_notifications" ON notification_logs;
CREATE POLICY "delete_own_notifications" ON notification_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Auto-create a profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();