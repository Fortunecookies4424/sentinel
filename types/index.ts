export type Relationship =
  | 'mother'
  | 'father'
  | 'sibling'
  | 'friend'
  | 'partner'
  | 'custom';

export type ThemeMode = 'light' | 'dark' | 'system';

export type EmergencyStatus = 'active' | 'resolved' | 'cancelled';

export type CheckInStatus = 'active' | 'completed' | 'missed' | 'expired';

export type ActivityType =
  | 'sos_activated'
  | 'sos_cancelled'
  | 'sos_resolved'
  | 'location_shared'
  | 'check_in_scheduled'
  | 'check_in_completed'
  | 'check_in_missed'
  | 'contact_added'
  | 'contact_removed'
  | 'profile_updated';

export type NotificationType =
  | 'emergency_alert'
  | 'contact_request'
  | 'check_in_reminder'
  | 'location_sharing'
  | 'sos_activated'
  | 'sos_cancelled';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  emergency_message: string;
  language: string;
  theme: string;
  biometric_enabled: boolean;
  share_location_enabled: boolean;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  relationship: Relationship;
  is_primary: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmergencySession {
  id: string;
  user_id: string;
  status: EmergencyStatus;
  message: string;
  contacts_notified: number;
  device_model: string | null;
  battery_level: number | null;
  last_lat: number | null;
  last_lng: number | null;
  last_accuracy: number | null;
  started_at: string;
  ended_at: string | null;
}

export interface LocationUpdate {
  id: string;
  user_id: string;
  session_id: string | null;
  share_token: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  battery_level: number | null;
  speed: number | null;
  heading: number | null;
  created_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  note: string;
  duration_minutes: number;
  status: CheckInStatus;
  due_at: string;
  triggered_sos: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface MedicalProfile {
  id: string;
  user_id: string;
  blood_group: string | null;
  allergies: string | null;
  medical_conditions: string | null;
  emergency_notes: string | null;
  emergency_medication: string | null;
  height: string | null;
  weight: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface NotificationLogEntry {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  status: string;
  created_at: string;
}

export interface LiveShareSession {
  id: string;
  durationMinutes: number;
  startedAt: number;
  active: boolean;
  token: string;
}

export interface DeviceStatus {
  batteryLevel: number | null;
  batteryCharging: boolean;
  gpsAvailable: boolean;
  internetAvailable: boolean;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
  } | null;
}

export const RELATIONSHIPS: { value: Relationship; label: string }[] = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'friend', label: 'Friend' },
  { value: 'partner', label: 'Partner' },
  { value: 'custom', label: 'Custom' },
];

export const ACTIVITY_META: Record<
  ActivityType,
  { label: string; color: string; icon: string }
> = {
  sos_activated: { label: 'SOS Activated', color: '#DC2626', icon: 'siren' },
  sos_cancelled: { label: 'SOS Cancelled', color: '#6B7280', icon: 'x-circle' },
  sos_resolved: { label: 'SOS Resolved', color: '#10B981', icon: 'check-circle' },
  location_shared: { label: 'Location Shared', color: '#2563EB', icon: 'map-pin' },
  check_in_scheduled: { label: 'Check-In Scheduled', color: '#0891B2', icon: 'clock' },
  check_in_completed: { label: 'Check-In Completed', color: '#10B981', icon: 'check' },
  check_in_missed: { label: 'Missed Check-In', color: '#F59E0B', icon: 'alert-triangle' },
  contact_added: { label: 'Contact Added', color: '#7C3AED', icon: 'user-plus' },
  contact_removed: { label: 'Contact Removed', color: '#6B7280', icon: 'user-minus' },
  profile_updated: { label: 'Profile Updated', color: '#6366F1', icon: 'user' },
};

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ar', label: 'Arabic' },
  { value: 'zh', label: 'Chinese' },
];

export const SHARE_DURATIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 0, label: 'Until stopped' },
];

export const CHECK_IN_DURATIONS = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
];
