import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '../navigation/types';
import { useAuth } from '../auth/AuthContext';
import OfflineBanner from '../components/OfflineBanner';
import SariSariHeader from '../components/SariSariHeader';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<MoreStackParamList, 'MoreHome'>;

// More menu sheet rows — mirrors Figma MoreMenuModalState (icon + label + chevron).
const ITEMS: { label: string; icon: string; route: keyof MoreStackParamList }[] = [
  { label: 'Restock List', icon: '🧾', route: 'RestockList' },
  { label: 'Expiry Tracker', icon: '⏰', route: 'ExpiryTracker' },
  { label: 'Pricing Calculator', icon: '🧮', route: 'PricingCalculator' },
  { label: 'Expenses', icon: '🧾', route: 'Expenses' },
  { label: 'Reports', icon: '📊', route: 'Reports' },
];

export default function MoreScreen({ navigation }: Props) {
  const { signOut } = useAuth();

  const logout = (): void => {
    Alert.alert('Log out?', 'You will need your email and password to log back in.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          const root = navigation.getParent()?.getParent() as unknown as {
            reset: (state: object) => void;
          } | undefined;
          root?.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  return (
    <View style={styles.flex}>
      <SariSariHeader storeName="Nena's Sari-Sari" subtitle="Utilities & records" />
      <OfflineBanner visible={false} queuedCount={0} />
      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.sheet}>
          {ITEMS.map((i) => (
            <TouchableOpacity key={i.route} style={styles.row} onPress={() => navigation.navigate(i.route)}>
              <Text style={styles.icon}>{i.icon}</Text>
              <Text style={styles.label}>{i.label}</Text>
              <Text style={styles.chev}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Text style={styles.logoutIcon}>⏻</Text>
          <Text style={styles.logoutLabel}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg },
  sheet: { backgroundColor: colors.card, borderRadius: radius.lg, paddingVertical: spacing.sm, ...shadow.card },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  icon: { fontSize: 20, width: 28, textAlign: 'center' },
  label: { flex: 1, color: colors.text, fontSize: fontSize.base, fontWeight: fontWeight.medium },
  chev: { color: colors.textSecondary, fontSize: 20 },
  logout: { marginTop: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md, ...shadow.card },
  logoutIcon: { fontSize: 20, width: 28, textAlign: 'center', color: colors.accentDark },
  logoutLabel: { flex: 1, color: colors.accentDark, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
});
