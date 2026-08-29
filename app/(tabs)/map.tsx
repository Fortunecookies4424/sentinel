import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { showToast } from '@/components/ui/Toast';
import { getCurrentPosition, formatCoords } from '@/lib/geo';
import { useDeviceStatus } from '@/lib/useDeviceStatus';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '@/lib/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { GeoPoint } from '@/lib/geo';

export default function MapScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const deviceStatus = useDeviceStatus();
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshLocation();
  }, []);

  const refreshLocation = async () => {
    setLoading(true);
    try {
      const pos = await getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
      setLocation(pos);
    } catch {
      // Use device status as fallback
      if (deviceStatus.location) {
        setLocation({
          latitude: deviceStatus.location.latitude,
          longitude: deviceStatus.location.longitude,
          accuracy: deviceStatus.location.accuracy,
          altitude: null,
          heading: null,
          speed: null,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = () => {
    if (!location) return;
    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    Linking.openURL(url).catch(() => showToast('error', 'Could not open maps'));
  };

  // Static map preview using OpenStreetMap tile
  const mapTileUrl = location
    ? `https://staticmap.openstreetmap.de/staticmap.php?center=${location.latitude},${location.longitude}&zoom=15&size=400x300&markers=${location.latitude},${location.longitude},red-pushpin`
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScreenHeader title="Map" subtitle="Your location and nearby points" large rightIcon="map-pin" onRightPress={refreshLocation} />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: insets.bottom + 100 }}
        entering={FadeInDown.springify()}
      >
        {/* Map Preview */}
        <Card elevation={2} padding={0} style={{ marginBottom: SPACING.lg, overflow: 'hidden' }}>
          {location ? (
            <>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <MapView lat={location.latitude} lng={location.longitude} theme={theme} accuracy={location.accuracy} />
              <View style={[styles.mapOverlay, { backgroundColor: theme.glass }]}>
                <View style={styles.mapInfo}>
                  <Icon name="map-pin" size={18} color={theme.danger} />
                  <View>
                    <Typography size="xs" color={theme.textSecondary}>Your position</Typography>
                    <Typography size="sm" weight="semibold" color={theme.text}>
                      {formatCoords(location.latitude, location.longitude)}
                    </Typography>
                  </View>
                </View>
                {loading && <Typography size="xs" color={theme.textMuted}>Updating...</Typography>}
              </View>
            </>
          ) : (
            <View style={[styles.noMap, { backgroundColor: theme.surface }]}>
              <Icon name="map" size={48} color={theme.textMuted} />
              <Typography size="md" color={theme.textSecondary} align="center" style={{ marginTop: SPACING.md }}>
                {loading ? 'Acquiring your location...' : 'Location unavailable'}
              </Typography>
              {!loading && (
                <Pressable
                  onPress={refreshLocation}
                  style={({ pressed }) => [styles.retryBtn, { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 }]}
                >
                  <Typography size="sm" color="#FFFFFF" weight="semibold">Retry</Typography>
                </Pressable>
              )}
            </View>
          )}
        </Card>

        {/* Location Details */}
        {location && (
          <Card elevation={1} style={{ marginBottom: SPACING.md }}>
            <View style={styles.detailRow}>
              <Icon name="navigation" size={20} color={theme.accent} />
              <View style={{ flex: 1 }}>
                <Typography size="xs" color={theme.textMuted}>Latitude</Typography>
                <Typography size="md" weight="semibold" color={theme.text}>{location.latitude.toFixed(6)}</Typography>
              </View>
              <View style={{ flex: 1 }}>
                <Typography size="xs" color={theme.textMuted}>Longitude</Typography>
                <Typography size="md" weight="semibold" color={theme.text}>{location.longitude.toFixed(6)}</Typography>
              </View>
            </View>
            <View style={[styles.detailRow, { marginTop: SPACING.md }]}>
              <Icon name="cross" size={20} color={theme.success} />
              <View style={{ flex: 1 }}>
                <Typography size="xs" color={theme.textMuted}>Accuracy</Typography>
                <Typography size="md" weight="semibold" color={theme.text}>
                  {location.accuracy ? `±${Math.round(location.accuracy)} meters` : 'Unknown'}
                </Typography>
              </View>
              <View style={{ flex: 1 }}>
                <Typography size="xs" color={theme.textMuted}>Altitude</Typography>
                <Typography size="md" weight="semibold" color={theme.text}>
                  {location.altitude ? `${Math.round(location.altitude)} m` : 'N/A'}
                </Typography>
              </View>
            </View>
          </Card>
        )}

        {/* Quick Actions */}
        <Typography size="md" weight="semibold" color={theme.text} style={{ marginBottom: SPACING.sm + 2 }}>Navigation</Typography>
        <View style={styles.actionGrid}>
          <Pressable
            onPress={openInMaps}
            disabled={!location}
            style={({ pressed }) => [styles.navCard, { backgroundColor: theme.surface, borderColor: theme.borderLight, opacity: pressed || !location ? 0.6 : 1 }]}
          >
            <View style={[styles.navIcon, { backgroundColor: theme.accent + '15' }]}>
              <Icon name="navigation" size={22} color={theme.accent} />
            </View>
            <Typography size="sm" weight="medium" color={theme.text}>Open in Maps</Typography>
          </Pressable>

          <Pressable
            onPress={refreshLocation}
            style={({ pressed }) => [styles.navCard, { backgroundColor: theme.surface, borderColor: theme.borderLight, opacity: pressed ? 0.6 : 1 }]}
          >
            <View style={[styles.navIcon, { backgroundColor: theme.success + '15' }]}>
              <Icon name="map-pin" size={22} color={theme.success} />
            </View>
            <Typography size="sm" weight="medium" color={theme.text}>Refresh Location</Typography>
          </Pressable>
        </View>

        {/* Info note */}
        <Card elevation={1} padding={SPACING.md} style={{ marginTop: SPACING.md }}>
          <View style={styles.infoRow}>
            <Icon name="info" size={18} color={theme.textMuted} />
            <Typography size="xs" color={theme.textSecondary} style={{ flex: 1 }}>
              Emergency contacts appear on the map only when you share your location or activate SOS. Your location is never tracked otherwise.
            </Typography>
          </View>
        </Card>
      </Animated.ScrollView>
    </View>
  );
}

function MapView({ lat, lng, theme, accuracy }: { lat: number; lng: number; theme: any; accuracy: number | null }) {
  // Simple SVG-based map representation
  return (
    <View style={[styles.mapView, { backgroundColor: theme.mode === 'dark' ? '#0A1E3A' : '#E8F0FE' }]}>
      {/* Grid lines to represent a map */}
      <View style={styles.mapGrid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLineH, { borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(15,42,74,0.06)' }]} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridLineV, { borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(15,42,74,0.06)' }]} />
        ))}
      </View>

      {/* Roads */}
      <View style={[styles.road1, { backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,42,74,0.1)' }]} />
      <View style={[styles.road2, { backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,42,74,0.1)' }]} />

      {/* Location marker with pulse */}
      <View style={styles.markerWrap}>
        <View style={[styles.accuracyCircle, { width: Math.min(accuracy ?? 60, 120), height: Math.min(accuracy ?? 60, 120) }]} />
        <View style={styles.markerPin}>
          <Icon name="map-pin" size={36} color={theme.danger} />
        </View>
      </View>

      <View style={styles.scaleBar}>
        <Typography size="xs" color={theme.textMuted}>Approx. location</Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapView: { width: '100%', height: 280, position: 'relative', overflow: 'hidden' },
  mapGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, borderTopWidth: 1 },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, borderLeftWidth: 1 },
  road1: { position: 'absolute', top: '40%', left: -20, right: -20, height: 8, transform: [{ rotate: '-8deg' }] },
  road2: { position: 'absolute', top: -20, bottom: -20, left: '55%', width: 6, transform: [{ rotate: '15deg' }] },
  markerWrap: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -18 }, { translateY: -36 }] },
  accuracyCircle: { position: 'absolute', top: 16, left: 14, borderRadius: 999, backgroundColor: 'rgba(220,38,38,0.12)', borderWidth: 1, borderColor: 'rgba(220,38,38,0.3)' },
  markerPin: { position: 'relative' },
  scaleBar: { position: 'absolute', bottom: 8, right: 12, backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  mapOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  mapInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  noMap: { height: 280, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  retryBtn: { marginTop: SPACING.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.md },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  actionGrid: { flexDirection: 'row', gap: SPACING.md },
  navCard: { flex: 1, alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.lg, borderRadius: RADIUS.md, borderWidth: 1 },
  navIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
});
