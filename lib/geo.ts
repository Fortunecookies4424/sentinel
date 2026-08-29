import { Platform } from 'react-native';

export interface GeoPoint {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
}

export interface GeoOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export async function getCurrentPosition(options?: GeoOptions): Promise<GeoPoint> {
  if (Platform.OS === 'web') {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        reject(new Error('Geolocation not supported on this device'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
          });
        },
        (err) => reject(new Error(err.message)),
        {
          enableHighAccuracy: options?.enableHighAccuracy ?? true,
          timeout: options?.timeout ?? 15000,
          maximumAge: options?.maximumAge ?? 10000,
        }
      );
    });
  }
  const { getCurrentPositionAsync } = await import('expo-location');
  const pos = await getCurrentPositionAsync({
    accuracy: options?.enableHighAccuracy ? 6 : 4,
    mayShowUserSettingsDialog: true,
  });
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    altitude: pos.coords.altitude,
    heading: pos.coords.heading,
    speed: pos.coords.speed,
  };
}

export async function watchPosition(
  onSuccess: (point: GeoPoint) => void,
  onError: (err: Error) => void,
  options?: GeoOptions
): Promise<() => void> {
  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      onError(new Error('Geolocation not supported'));
      return () => {};
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        onSuccess({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
        });
      },
      (err) => onError(new Error(err.message)),
      {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 20000,
        maximumAge: options?.maximumAge ?? 5000,
      }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }
  const { watchPositionAsync } = await import('expo-location');
  const subscription = await watchPositionAsync(
    {
      accuracy: options?.enableHighAccuracy ? 6 : 4,
      timeInterval: options?.maximumAge ?? 5000,
      distanceInterval: 0,
    },
    (pos) => {
      onSuccess({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        altitude: pos.coords.altitude,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
      });
    }
  );
  return () => subscription.remove();
}

export function formatCoords(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${ns}, ${Math.abs(lng).toFixed(4)}°${ew}`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
