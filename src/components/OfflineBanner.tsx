import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { colors, fontSize, fontWeight, radius, spacing } from '../theme/theme';

interface OfflineBannerProps {
  /**
   * Manual override. When omitted, the banner shows itself only while the
   * device is actually offline (no connection / no internet reachability).
   */
  visible?: boolean;
  cachedAt?: string;
  queuedCount?: number;
}

// Solid purple offline bar (mirrors Figma OfflineSyncStatus).
// Auto-hides when the device is online so it never cries wolf on full signal.
export default function OfflineBanner({ visible, cachedAt, queuedCount = 0 }: OfflineBannerProps) {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    NetInfo.fetch().then((state) => {
      if (mounted) setIsOnline(state.isConnected === true && state.isInternetReachable !== false);
    });
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (mounted) setIsOnline(state.isConnected === true && state.isInternetReachable !== false);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const show = visible ?? (isOnline === false);
  if (!show) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>☁</Text>
      <Text style={styles.text}>Offline · {cachedAt ?? 'all data saved on this device'}</Text>
      <View style={styles.queue}>
        <Text style={styles.queueLabel}>{queuedCount} queued</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  icon: { color: colors.white, fontSize: 14 },
  text: { flex: 1, color: colors.white, fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  queue: { backgroundColor: colors.white, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 3 },
  queueLabel: { color: colors.primary, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
});
