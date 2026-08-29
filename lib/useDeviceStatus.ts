import { Platform } from 'react-native';
import { useEffect, useState } from 'react';
import type { DeviceStatus } from '@/types';
import { getCurrentPosition } from '@/lib/geo';

function getDeviceModel(): string {
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent;
      if (/iPhone/.test(ua)) return 'iPhone (Web)';
      if (/Android/.test(ua)) return 'Android (Web)';
      if (/Mac/.test(ua)) return 'Mac (Web)';
      if (/Windows/.test(ua)) return 'Windows (Web)';
      return 'Web Browser';
    }
    return 'Unknown';
  }
  return `${Platform.OS} Device`;
}

export function useDeviceStatus(): DeviceStatus {
  const [status, setStatus] = useState<DeviceStatus>({
    batteryLevel: null,
    batteryCharging: false,
    gpsAvailable: false,
    internetAvailable: typeof navigator !== 'undefined' ? navigator.onLine : true,
    location: null,
  });

  useEffect(() => {
    let mounted = true;

    // Battery
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      const nav = navigator as Navigator & {
        getBattery?: () => Promise<{ level: number; charging: boolean; addEventListener: (e: string, cb: () => void) => void }>;
      };
      if (nav.getBattery) {
        nav.getBattery().then((battery) => {
          if (!mounted) return;
          const update = () => {
            setStatus((s) => ({
              ...s,
              batteryLevel: Math.round(battery.level * 100),
              batteryCharging: battery.charging,
            }));
          };
          update();
          battery.addEventListener('levelchange', update);
          battery.addEventListener('chargingchange', update);
        }).catch(() => {});
      }
    }

    // Online status
    const handleOnline = () => setStatus((s) => ({ ...s, internetAvailable: true }));
    const handleOffline = () => setStatus((s) => ({ ...s, internetAvailable: false }));
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    // Location — uses expo-location on native, navigator.geolocation on web
    getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 })
      .then((pos) => {
        if (!mounted) return;
        setStatus((s) => ({
          ...s,
          gpsAvailable: true,
          location: { latitude: pos.latitude, longitude: pos.longitude, accuracy: pos.accuracy },
        }));
      })
      .catch(() => {
        if (mounted) setStatus((s) => ({ ...s, gpsAvailable: false }));
      });

    return () => {
      mounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  return status;
}

export function getDeviceModelSync(): string {
  return getDeviceModel();
}
