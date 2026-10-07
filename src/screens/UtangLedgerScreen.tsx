import { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { UtangStackParamList } from '../navigation/types';
import EmptyState from '../components/EmptyState';
import OfflineBanner from '../components/OfflineBanner';
import SariSariHeader from '../components/SariSariHeader';
import { formatCreditDate, useStore } from '../store/AppStore';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../theme/theme';

// CreditLedgerScreen: purple balance card, search+filter, per-customer rows.
// Tapping a customer opens their full dated credit history.
const FILTERS: string[] = ['All', 'Overdue', 'Due soon', 'Current'];

type Props = NativeStackScreenProps<UtangStackParamList, 'UtangHome'>;

interface CustomerRow {
  name: string;
  total: number;
  count: number;
  latest: string;
  worst: 'Overdue' | 'Due soon' | 'Current';
}

export default function UtangLedgerScreen({ navigation }: Props) {
  const { ledger } = useStore();
  const [q, setQ] = useState<string>('');
  const [filter, setFilter] = useState<string>('All');
  const total: number = ledger.reduce((s, i) => s + i.amount, 0);
  const overdueCount = ledger.filter((e) => e.status === 'Overdue').length;
  const overdueTotal = ledger.filter((e) => e.status === 'Overdue').reduce((s, i) => s + i.amount, 0);

  const byName = new Map<string, CustomerRow>();
  for (const e of ledger) {
    const row = byName.get(e.name) ?? { name: e.name, total: 0, count: 0, latest: e.date, worst: 'Current' as const };
    row.total += e.amount;
    row.count += 1;
    if (e.date > row.latest) row.latest = e.date;
    const rank = e.status === 'Overdue' ? 0 : e.status.startsWith('Due') ? 1 : 2;
    const worstRank = row.worst === 'Overdue' ? 0 : row.worst === 'Due soon' ? 1 : 2;
    if (rank < worstRank) row.worst = rank === 0 ? 'Overdue' : 'Due soon';
    byName.set(e.name, row);
  }
  const customers = [...byName.values()].sort((a, b) => b.total - a.total);

  const match = (c: CustomerRow): boolean => {
    if (filter === 'Overdue') return c.worst === 'Overdue';
    if (filter === 'Due soon') return c.worst === 'Due soon';
    if (filter === 'Current') return c.worst === 'Current';
    return true;
  };
  const rows = customers.filter((c) => match(c) && c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <View style={styles.flex}>
      <SariSariHeader storeName="Credit Ledger" subtitle="Utang tracker · Nena's Sari-Sari" variant="inner" onBack={() => navigation.goBack()} />
      <OfflineBanner />
      <View style={styles.totalCard}>
        <View style={styles.totalHead}>
          <Text style={styles.totalLabel}>Outstanding balance</Text>
          <Text style={styles.totalCount}>{customers.length} customers</Text>
        </View>
        <Text style={styles.totalValue}>₱{total.toFixed(2)}</Text>
        <Text style={styles.overdue}>{overdueCount} overdue accounts · ₱{overdueTotal.toFixed(2)} overdue</Text>
      </View>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Search customers"
          placeholderTextColor={colors.textSecondary}
          value={q}
          onChangeText={setQ}
        />
        <TouchableOpacity
          style={[styles.filterBtn, filter !== 'All' && styles.filterBtnActive]}
          onPress={() => {
            setFilter(FILTERS[(FILTERS.indexOf(filter) + 1) % FILTERS.length]);
          }}
        >
          <Text style={[styles.filterLabel, filter !== 'All' && styles.filterLabelActive]}>{filter} ⏷</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(i) => i.name}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="No matches" message="Try another search or filter." />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('UtangCustomer', { name: item.name })}
          >
            <View style={styles.rowInfo}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.note}>
                {item.count} {item.count === 1 ? 'credit' : 'credits'} · last credited {formatCreditDate(item.latest)}
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.amount}>₱{item.total.toFixed(2)}</Text>
              <Text style={[styles.pill, item.worst === 'Overdue' ? styles.pillOverdue : styles.pillDue]}>{item.worst}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <View style={styles.ctaRow}>
        <TouchableOpacity style={[styles.cta, styles.ctaOutline]} onPress={() => navigation.navigate('AddUtang', {})}>
          <Text style={styles.ctaOutlineText}>+  Add utang</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.cta, styles.recordBtn]} onPress={() => navigation.navigate('CreditPaymentModal', {})}>
          <Text style={styles.recordText}>Record payment</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.intent}>🛡  Payments save on this device — no connection needed.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  totalCard: { backgroundColor: colors.primary, margin: spacing.lg, borderRadius: radius.lg, padding: spacing.lg, gap: 2, ...shadow.card },
  totalHead: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { color: colors.white, fontSize: fontSize.sm, opacity: 0.9 },
  totalCount: { color: colors.white, fontSize: fontSize.xs, opacity: 0.9 },
  totalValue: { color: colors.white, fontSize: 32, fontWeight: fontWeight.bold },
  overdue: { color: colors.white, fontSize: fontSize.xs, opacity: 0.9 },
  searchRow: { flexDirection: 'row', marginHorizontal: spacing.lg, gap: spacing.sm },
  search: { flex: 1, height: 48, borderWidth: 0, borderRadius: radius.full, paddingHorizontal: spacing.lg, backgroundColor: colors.card, fontSize: fontSize.sm, color: colors.text, ...shadow.card },
  filterBtn: { height: 48, paddingHorizontal: spacing.lg, borderRadius: radius.full, backgroundColor: colors.card, justifyContent: 'center', ...shadow.card },
  filterBtnActive: { backgroundColor: colors.primary },
  filterLabel: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.semibold },
  filterLabelActive: { color: colors.white },
  list: { padding: spacing.lg, gap: spacing.sm },
  row: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, ...shadow.card },
  rowInfo: { flex: 1, gap: 2 },
  name: { color: colors.text, fontWeight: fontWeight.semibold, fontSize: fontSize.base },
  note: { color: colors.textSecondary, fontSize: fontSize.xs },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  amount: { color: colors.text, fontWeight: fontWeight.bold, fontSize: fontSize.base },
  pill: { fontSize: 11, fontWeight: fontWeight.bold, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full, overflow: 'hidden' },
  pillOverdue: { color: colors.accentDark, backgroundColor: colors.accentLight },
  pillDue: { color: colors.primary, backgroundColor: colors.primaryLight },
  recordBtn: { backgroundColor: colors.primary, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  recordText: { color: colors.white, fontWeight: fontWeight.bold, fontSize: fontSize.base },
  ctaRow: { flexDirection: 'row', marginHorizontal: spacing.lg, gap: spacing.sm },
  cta: { flex: 1, borderRadius: radius.full, padding: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  ctaOutline: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  ctaOutlineText: { color: colors.primary, fontWeight: fontWeight.bold, fontSize: fontSize.base },
  intent: { color: colors.textSecondary, fontSize: fontSize.xs, textAlign: 'center', margin: spacing.sm },
});
