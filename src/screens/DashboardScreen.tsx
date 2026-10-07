import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import OfflineBanner from '../components/OfflineBanner';
import SariSariHeader from '../components/SariSariHeader';
import { useAuth } from '../auth/AuthContext';
import { useStore } from '../store/AppStore';
import { getProducts } from '../services/db';
import type { DbProduct } from '../services/db';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../theme/theme';

type Props = BottomTabScreenProps<any, 'Home'>;

const LOW_STOCK_AT = 10;

// DashboardScreen: purple sales card, status cards, restock alerts, quick actions.
// Product stats come from the same SQLite database as Inventory and POS.
export default function DashboardScreen({ navigation }: Props) {
  const { ledger } = useStore();
  const { session } = useAuth();
  const storeName = session?.storeName?.trim() ? session.storeName.trim() : 'My Sari-Sari Store';
  const [products, setProducts] = useState<DbProduct[]>([]);

  useFocusEffect(
    useCallback(() => {
      try {
        setProducts(getProducts(''));
      } catch {
        // keep last known products when the database is unavailable
      }
    }, []),
  );

  const lowItems = products.filter((p) => p.stock <= LOW_STOCK_AT);
  const restock = [...products].sort((a, b) => a.stock - b.stock).slice(0, 3);
  const utangTotal = ledger.reduce((s, e) => s + e.amount, 0);
  return (
    <View style={styles.flex}>
      <SariSariHeader storeName="Tindahan" subtitle={`Mabuhay, ${storeName}!`} />
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.salesCard}>
          <View>
            <Text style={styles.salesLabel}>Today’s sales · Oct 3</Text>
            <Text style={styles.salesAmount}>₱1,245.00</Text>
            <Text style={styles.salesSub}>18 paid orders · 63 items sold</Text>
          </View>
          <Text style={styles.salesIcon}>💼</Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.stat, styles.statWhite]}>
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>Active products</Text>
          </View>
          <View style={[styles.stat, styles.statPeach]}>
            <Text style={[styles.statValue, styles.statAlert]}>{lowItems.length}</Text>
            <Text style={styles.statLabel}>Low-stock items</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.stat, styles.statWhite]}>
            <Text style={styles.statValue}>₱{utangTotal.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Utang outstanding</Text>
          </View>
          <View style={[styles.stat, styles.statWhite]}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Expiring soon</Text>
          </View>
        </View>

        <View style={styles.alertsHead}>
          <Text style={styles.sectionTitle}>Restock soon</Text>
          <Text style={styles.sub}>{restock.length} need attention</Text>
        </View>
        <View style={styles.card}>
          {restock.length === 0 ? (
            <Text style={styles.sub}>All stocked up. Nothing needs attention.</Text>
          ) : (
            restock.map((p) => (
              <View key={p.id} style={styles.alertRow}>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertName}>{p.name}</Text>
                  <Text style={styles.sub}>{p.category} · ₱{p.price.toFixed(2)}</Text>
                </View>
                <Text style={styles.alertStock}>{p.stock} pcs left</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.action, styles.actionOrange]} onPress={() => navigation.navigate('POS')}>
            <Text style={styles.actionLabel}>+  New sale</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.action, styles.actionWhite]} onPress={() => navigation.navigate('Inventory')}>
            <Text style={[styles.actionLabel, styles.actionLabelPurple]}>⇄  Restock</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reassure}>
          <Text style={styles.reassureText}>🛡  Sales stay on this device — no connection needed.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xl, gap: spacing.md, paddingTop: spacing.md },
  salesCard: { marginHorizontal: spacing.lg, backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...shadow.card },
  salesLabel: { color: colors.white, fontSize: fontSize.sm, opacity: 0.9 },
  salesAmount: { color: colors.white, fontSize: 32, fontWeight: fontWeight.bold },
  salesSub: { color: colors.white, fontSize: fontSize.xs, opacity: 0.9 },
  salesIcon: { fontSize: 28 },
  row: { flexDirection: 'row', marginHorizontal: spacing.lg, gap: spacing.md },
  stat: { flex: 1, borderRadius: radius.md, padding: spacing.lg, ...shadow.card },
  statWhite: { backgroundColor: colors.card },
  statPeach: { backgroundColor: colors.accentLight },
  statValue: { color: colors.text, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  statAlert: { color: colors.accentDark },
  statLabel: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  alertsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginHorizontal: spacing.lg },
  sectionTitle: { color: colors.text, fontSize: fontSize.base, fontWeight: fontWeight.bold },
  sub: { color: colors.textSecondary, fontSize: fontSize.xs },
  card: { marginHorizontal: spacing.lg, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md, ...shadow.card },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  alertInfo: { flex: 1, gap: 2 },
  alertName: { color: colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  alertStock: { color: colors.accentDark, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  action: { flex: 1, borderRadius: radius.full, padding: spacing.lg, alignItems: 'center' },
  actionOrange: { backgroundColor: colors.accent },
  actionWhite: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  actionLabel: { color: colors.white, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  actionLabelPurple: { color: colors.primary },
  reassure: { marginHorizontal: spacing.lg, backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md },
  reassureText: { color: colors.textSecondary, fontSize: fontSize.xs, textAlign: 'center' },
});
