import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '../navigation/types';
import OfflineBanner from '../components/OfflineBanner';
import SariSariHeader from '../components/SariSariHeader';
import { useStore } from '../store/AppStore';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<MoreStackParamList, 'Reports'>;

const TYPES = ['Sales', 'Inventory', 'Expiry', 'Utang', 'Expenses'];
const BARS = [40, 64, 56, 88, 72, 110];
const HOURS = ['6 AM', '7 AM', '8 AM', '9 AM', '9:30', '9:41'];
const EXPIRY = [
  { name: 'Ligo Sardines', detail: 'LG-018 · 6 days left · Expires Oct 9', urgent: true },
  { name: 'Regular milled rice', detail: 'RC-012 · 12 days left · Expires Oct 15', urgent: false },
  { name: 'Kopiko Brown', detail: 'KB-007 · 25 days left · Expires Oct 28', urgent: false },
  { name: 'Coca-Cola', detail: 'CC-021 · 48 days left · Expires Nov 20', urgent: false },
];

// ReportsScreen: one screen, five reports (mirrors Figma + live store data).
export default function ReportsScreen({ navigation }: Props) {
  const [period, setPeriod] = useState<string>('Today');
  const [type, setType] = useState<string>('Sales');
  const { products, ledger, expenses } = useStore();

  const low = products.filter((p) => p.low);
  const utangTotal = ledger.reduce((s, e) => s + e.amount, 0);
  const overdue = ledger.filter((e) => e.status === 'Overdue');
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <View style={styles.flex}>
      <SariSariHeader storeName="Reports" subtitle="Saturday, October 3 · includes local sales" variant="inner" onBack={() => navigation.goBack()} />
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.container}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.types}>
          {TYPES.map((t) => (
            <TouchableOpacity key={t} style={[styles.type, type === t && styles.typeActive]} onPress={() => setType(t)}>
              <Text style={[styles.typeLabel, type === t && styles.typeLabelActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.periods}>
          {['Today', '7 days', 'Month'].map((p) => (
            <TouchableOpacity key={p} style={[styles.period, period === p && styles.periodActive]} onPress={() => setPeriod(p)}>
              <Text style={[styles.periodLabel, period === p && styles.periodLabelActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {type === 'Sales' ? (
          <>
            <View style={styles.hero}>
              <View style={styles.heroCol}>
                <Text style={styles.heroLabel}>Daily revenue</Text>
                <Text style={styles.heroAmount}>₱1,245.00</Text>
                <Text style={styles.heroSub}>18 paid orders</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroCol}>
                <Text style={styles.heroLabel}>Items sold</Text>
                <Text style={styles.heroAmount}>63</Text>
                <Text style={styles.heroSub}>On this device</Text>
              </View>
            </View>
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardLabel}>Sales through today</Text>
                <Text style={styles.sub}>Revenue · ₱</Text>
              </View>
              <View style={styles.bars}>
                {BARS.map((h, i) => (
                  <View key={i} style={styles.barWrap}>
                    <View style={[styles.bar, i === BARS.length - 1 && styles.barLast, { height: h }]} />
                    <Text style={styles.barLabel}>{HOURS[i]}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Top products · by revenue</Text>
              <Text style={styles.name}>Regular milled rice · 12 kg sold</Text>
              <Text style={styles.value}>₱660.00</Text>
              <Text style={styles.name}>Coca-Cola · 18 bottles</Text>
              <Text style={styles.value}>₱450.00</Text>
            </View>
          </>
        ) : null}

        {type === 'Inventory' ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Stock report · {products.length} products · {low.length} low</Text>
            {products.map((p) => (
              <View key={p.id} style={styles.line}>
                <View style={styles.lineInfo}>
                  <Text style={styles.name}>{p.name}</Text>
                  <Text style={styles.sub}>{p.stockLabel}</Text>
                </View>
                <Text style={[styles.flag, p.low && styles.flagLow]}>{p.low ? 'LOW' : 'OK'}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {type === 'Expiry' ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Expiry report · 3 batches within 30 days</Text>
            {EXPIRY.map((b) => (
              <View key={b.name} style={styles.line}>
                <View style={styles.lineInfo}>
                  <Text style={styles.name}>{b.name}</Text>
                  <Text style={styles.sub}>{b.detail}</Text>
                </View>
                <Text style={[styles.flag, b.urgent && styles.flagLow]}>{b.urgent ? 'URGENT' : 'TRACKED'}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {type === 'Utang' ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Utang report · {ledger.length} customers</Text>
            <Text style={styles.amount}>₱{utangTotal.toFixed(2)}</Text>
            <Text style={styles.sub}>{overdue.length} overdue · ₱{overdue.reduce((s, e) => s + e.amount, 0).toFixed(2)} overdue</Text>
            {ledger.map((e) => (
              <View key={e.id} style={styles.line}>
                <View style={styles.lineInfo}>
                  <Text style={styles.name}>{e.name}</Text>
                  <Text style={styles.sub}>{e.note}</Text>
                </View>
                <Text style={styles.value}>₱{e.amount.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {type === 'Expenses' ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Expenses report · {expenses.length} entries</Text>
            <Text style={styles.amount}>₱{expenseTotal.toFixed(2)}</Text>
            {expenses.map((e) => (
              <View key={e.id} style={styles.line}>
                <Text style={styles.name}>{e.label}</Text>
                <Text style={styles.value}>₱{e.amount.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: spacing.xl, gap: spacing.md, paddingTop: spacing.md },
  types: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  type: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  typeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeLabel: { fontWeight: fontWeight.semibold, fontSize: fontSize.sm, color: colors.text },
  typeLabelActive: { color: colors.white },
  periods: { flexDirection: 'row', marginHorizontal: spacing.lg, gap: spacing.sm },
  period: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center' },
  periodActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodLabel: { fontWeight: fontWeight.semibold, fontSize: fontSize.sm, color: colors.text },
  periodLabelActive: { color: colors.white },
  hero: { marginHorizontal: spacing.lg, backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, flexDirection: 'row', ...shadow.card },
  heroCol: { flex: 1, gap: 2 },
  heroLabel: { color: colors.white, fontSize: fontSize.xs, opacity: 0.9 },
  heroAmount: { color: colors.white, fontSize: 26, fontWeight: fontWeight.bold },
  heroSub: { color: colors.white, fontSize: fontSize.xs, opacity: 0.9 },
  heroDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.35)', marginHorizontal: spacing.md },
  card: { marginHorizontal: spacing.lg, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm, ...shadow.card },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardLabel: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text },
  sub: { fontSize: fontSize.xs, color: colors.textSecondary },
  amount: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingTop: spacing.sm },
  barWrap: { flex: 1, alignItems: 'center', gap: 4 },
  bar: { width: '70%', borderRadius: 6, backgroundColor: colors.primaryLight },
  barLast: { backgroundColor: colors.primary },
  barLabel: { fontSize: 10, color: colors.textSecondary },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  lineInfo: { flex: 1, gap: 2 },
  name: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.text },
  value: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.primary },
  flag: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.success, backgroundColor: colors.background, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full, overflow: 'hidden' },
  flagLow: { color: colors.accentDark, backgroundColor: colors.accentLight },
});
